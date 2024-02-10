import { IBelong, XCollection } from '../..';
import { common, kernel, schema } from '../../../base';
import { XObject } from '../../public/object';
import { IPeriod, Period } from './period';

/** 汇总数据 */
export interface ItemSummary extends schema.XSpeciesItem {
  [field: string]: any;
}

/** 财务接口 */
export interface IFinancial extends common.Emitter {
  /** 归属对象 */
  space: IBelong;
  /** 元数据 */
  metadata: schema.XFinancial;
  /** 初始化结账月 */
  initialized: string | undefined;
  /** 当前账期 */
  current: string | undefined;
  /** 平均年限法 */
  yearAverage: schema.YearAverage | undefined;
  /** 统计维度 */
  species: schema.XProperty | undefined;
  /** 统计字段 */
  fields: schema.XProperty[];
  /** 缓存 */
  financialCache: XObject<schema.Xbase>;
  /** 账期集合 */
  coll: XCollection<schema.XPeriod>;
  /** 期数集合 */
  periods: IPeriod[];
  /** 获取偏移的期数 */
  getOffsetPeriod(period: string, offset: number): string;
  /** 初始化账期 */
  initialize(period: string): Promise<void>;
  /** 设置当前账期 */
  setCurrent(period: string): Promise<void>;
  /** 设置折旧配置 */
  setYearAverage(yearAverage: schema.YearAverage): Promise<void>;
  /** 清空结账日期 */
  clear(): Promise<void>;
  /** 设置总账统计维度（分类型、字典型） */
  setSpecies(species: schema.XProperty): Promise<void>;
  /** 发现分类型 */
  findSpecies(speciesId: string): Promise<schema.XSpecies | undefined>;
  /** 加载分类明细项 */
  loadSpeciesItems(speciesId: string): Promise<schema.XSpeciesItem[]>;
  /** 设置总账统计字段（数值型） */
  setFields(fields: schema.XProperty[]): Promise<void>;
  /** 加载财务数据 */
  loadContent(): Promise<void>;
  /** 加载账期 */
  loadPeriods(reload?: boolean): Promise<IPeriod[]>;
  /** 生成账期 */
  generatePeriod(period: string): Promise<void>;
  /** 加载分类树 */
  loadSpecies(reload?: boolean): Promise<schema.XSpeciesItem[]>;
  /** 统计某一时刻快照按统计维度的汇总值 */
  summary(period: string): Promise<Map<string, any>>;
  /** 统计变动的汇总值 */
  summaryChange(period: string): Promise<Map<string, any>>;
  /** 统计区间的汇总至 */
  summaryRange(start: string, end: string): Promise<common.Node<ItemSummary>[]>;
  /** 生成快照 */
  generateSnapshot(period: string): Promise<void>;
}

export class Financial extends common.Emitter implements IFinancial {
  constructor(belong: IBelong) {
    super();
    this.space = belong;
    this.metadata = {};
    this.financialCache = new XObject(
      belong.metadata,
      'target-financial',
      [],
      [this.key],
    );
    this.averageCache = new XObject(
      belong.metadata,
      'financial-year-average',
      [],
      [this.key],
    );
    this.coll = this.space.resource.periodColl;
    this.coll.subscribe([this.key], (result) => {
      switch (result.operate) {
        case 'insert':
          this.periods.unshift(new Period(result.data, this));
          this.setCurrent(result.data.period);
          break;
        case 'update':
          this.periods.forEach((item) => {
            if (result.data.id == item.id) {
              item.updateMetadata(result.data);
            }
          });
          break;
        case 'clear':
          this.periods = [];
          break;
      }
      this.changCallback();
    });
  }
  yearAverage: schema.YearAverage | undefined;
  financialCache: XObject<schema.Xbase>;
  averageCache: XObject<schema.YearAverage>;
  metadata: schema.XFinancial;
  speciesLoaded: boolean = false;
  space: IBelong;
  periods: IPeriod[] = [];
  loaded: boolean = false;
  coll: XCollection<schema.XPeriod>;
  speciesItems: schema.XSpeciesItem[] = [];
  get key() {
    return this.space.key + '-financial';
  }
  get initialized(): string | undefined {
    return this.metadata?.initialized;
  }
  get current(): string | undefined {
    return this.metadata?.current;
  }
  get species(): schema.XProperty | undefined {
    return this.metadata?.species;
  }
  get fields(): schema.XProperty[] {
    return this.metadata?.fields ?? [];
  }
  async loadContent(): Promise<void> {
    const data = await this.financialCache.get<schema.XFinancial>('');
    if (data) {
      this.metadata = data;
    }
    this.financialCache.subscribe('', (res: schema.XFinancial) => {
      this.metadata = res;
      this.changCallback();
    });
    this.financialCache.subscribe('initialized', (res: string) => {
      this.metadata.initialized = res;
      this.changCallback();
    });
    this.financialCache.subscribe('current', (res: string) => {
      if (this.metadata) {
        this.metadata.current = res;
        this.changCallback();
      }
    });
    this.averageCache.subscribe('', (res: schema.YearAverage) => {
      this.yearAverage = res;
      this.changCallback();
    });
    this.financialCache.subscribe('species', (res: schema.XProperty) => {
      if (this.metadata) {
        this.metadata.species = res;
        this.changCallback();
      }
    });
    this.financialCache.subscribe('fields', (res: schema.XProperty[]) => {
      if (this.metadata) {
        this.metadata.fields = res;
        this.changCallback();
      }
    });
  }
  async findSpecies(speciesId: string): Promise<schema.XSpecies | undefined> {
    const result = await this.space.resource.speciesColl.loadResult({
      options: { match: { id: speciesId } },
    });
    if (result.success && result.data.length > 0) {
      return result.data[0];
    }
  }
  async loadSpeciesItems(speciesId: string): Promise<schema.XSpeciesItem[]> {
    const items = await this.space.resource.speciesItemColl.loadResult({
      options: { match: { speciesId: speciesId } },
    });
    if (items.success) {
      return items.data;
    }
    return [];
  }
  async setSpecies(species: schema.XProperty): Promise<void> {
    if (await this.financialCache.set('species', species)) {
      await this.financialCache.notity('species', species, true, false);
    }
  }
  async setFields(fields: schema.XProperty[]): Promise<void> {
    if (await this.financialCache.set('fields', fields)) {
      await this.financialCache.notity('fields', fields, true, false);
    }
  }
  async initialize(period: string): Promise<void> {
    if (await this.financialCache.set('initialized', period)) {
      await this.financialCache.notity('initialized', period, true, false);
    }
  }
  async setCurrent(period: string) {
    if (await this.financialCache.set('current', period)) {
      await this.financialCache.notity('current', period, true, false);
    }
  }
  async setYearAverage(yearAverage: schema.YearAverage): Promise<void> {
    if (await this.averageCache.set('', yearAverage)) {
      await this.averageCache.notity('', yearAverage, true, false);
    }
  }
  async clear(): Promise<void> {
    if (await this.financialCache.set('', {})) {
      await this.financialCache.notity('', {}, true, false);
    }
    if (await this.averageCache.set('', {})) {
      await this.averageCache.notity('', {}, true, false);
    }
    if (await this.coll.removeMatch({})) {
      await this.coll.notity({ operate: 'clear' });
    }
  }
  async loadPeriods(reload: boolean = false, skip: number = 0): Promise<IPeriod[]> {
    if (!this.loaded || reload) {
      this.loaded = true;
      if (skip == 0) {
        this.periods = [];
      }
      const take = 12 * 6;
      const res = await this.space.resource.periodColl.loadResult({
        skip: skip,
        take: take,
        options: {
          match: {
            isDeleted: false,
          },
          sort: {
            period: -1,
          },
        },
      });
      if (res.success) {
        if (res.data && res.data.length > 0) {
          this.periods.push(...res.data.map((item) => new Period(item, this)));
          if (this.periods.length < res.totalCount && res.data.length === take) {
            await this.loadPeriods(true, this.periods.length);
          }
        }
      }
    }
    return this.periods;
  }
  async generatePeriod(period: string): Promise<void> {
    const result = await this.space.resource.periodColl.insert({
      period: period,
      data: {} as schema.XThing,
      depreciated: false,
      closed: false,
      balanced: false,
    } as schema.XPeriod);
    if (result) {
      await this.coll.notity({ data: result, operate: 'insert' });
    }
  }
  async loadSpecies(reload?: boolean | undefined): Promise<schema.XSpeciesItem[]> {
    const species = this.metadata?.species;
    if (!species || species.speciesId.length == 0) {
      return [];
    }
    if (!this.speciesLoaded || reload) {
      this.speciesLoaded = true;
      this.speciesItems = await this.space.resource.speciesItemColl.loadSpace({
        options: { match: { speciesId: species.speciesId } },
      });
    }
    return this.speciesItems;
  }
  async summary(period: string): Promise<Map<string, any>> {
    const map = new Map<string, any>();
    if (!this.species) {
      return map;
    }
    let group: any = {
      key: this.species.id,
    };
    this.fields.map((item) => {
      group[item.id] = { _sum_: '$' + item.id };
    });
    let options = [
      {
        match: {
          belongId: this.space.id,
          [this.species.id]: { _ne_: null },
        },
      },
      {
        group: group,
      },
      { limit: this.speciesItems.length },
    ];
    const result = await kernel.collectionAggregate(
      this.space.id,
      [this.space.id],
      period == this.current ? '_system-things' : '_system-things_' + period,
      options,
    );
    if (result.success && Array.isArray(result.data)) {
      for (const item of result.data) {
        map.set(item[this.species.id], item);
      }
    }
    return map;
  }
  async summaryChange(
    period: string,
  ): Promise<Map<string, Map<string, Map<number, any>>>> {
    const map = new Map<string, Map<string, Map<number, any>>>();
    if (!this.species) {
      return map;
    }
    let options = [
      {
        match: {
          belongId: this.space.id,
          changeTime: period,
          [this.species.id]: { _ne_: null },
        },
      },
      {
        group: {
          key: [this.species.id, 'propId', 'symbol'],
          change: { _sum_: '$change' },
        },
      },
      { limit: this.speciesItems.length },
    ];
    const result = await kernel.collectionAggregate(
      this.space.id,
      [this.space.id],
      '_system-things-changed',
      options,
    );
    if (result.success && Array.isArray(result.data)) {
      for (const item of result.data) {
        if (!map.has(item[this.species.id])) {
          map.set(item[this.species.id], new Map<string, Map<number, any>>());
        }
        const species = map.get(item[this.species.id])!;
        if (!species.has(item.propId)) {
          species.set(item.propId, new Map<number, any>());
        }
        const prop = species.get(item.propId)!;
        prop.set(item.symbol, item.change);
      }
    }
    return map;
  }
  async summaryRange(start: string, end: string): Promise<common.Node<ItemSummary>[]> {
    const res = await this.loadSpecies();

    const beforeMap = await this.summary(this.getOffsetPeriod(start, -1));
    const changeMap = await this.summaryChange(end);
    const afterMap = await this.summary(end);

    const nodes: ItemSummary[] = [];
    for (const item of res) {
      const dimension = 'S' + item.id;
      const one: ItemSummary = { ...item };
      const before = beforeMap.get(dimension);
      const after = afterMap.get(dimension);
      const change = changeMap.get(dimension);
      for (const field of this.fields) {
        one['before-' + field.id] = Number(before?.[field.id] ?? 0);
        one['after-' + field.id] = Number(after?.[field.id] ?? 0);
        one['plus-' + field.id] = Number(change?.get(field.id)?.get(1) ?? 0);
        one['minus-' + field.id] = Number(change?.get(field.id)?.get(-1) ?? 0);
      }
      nodes.push(one);
    }
    const tree = new common.AggregateTree(
      nodes,
      (item) => item.id,
      (item) => item.parentId,
    );
    tree.summary((pre, cur, _, __) => {
      for (const field of this.fields) {
        pre['before-' + field.id] += cur['before-' + field.id];
        pre['after-' + field.id] += cur['after-' + field.id];
        pre['plus-' + field.id] += cur['plus-' + field.id];
        pre['minus-' + field.id] += cur['minus-' + field.id];
      }
      return pre;
    });
    return tree.root.children;
  }
  getOffsetPeriod(period: string, offsetMonth: number): string {
    const currentMonth = new Date(period);
    const preMonth = new Date(currentMonth);
    preMonth.setMonth(currentMonth.getMonth() + offsetMonth);
    return common.formatDate(preMonth, 'yyyy-MM');
  }
  async generateSnapshot(period: string): Promise<void> {
    await kernel.snapshotThing(this.space.id, [this.space.id], {
      collName: '_system-things',
      dataPeriod: period,
    });
  }
}
