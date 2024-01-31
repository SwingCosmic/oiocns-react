import { IBelong, XCollection, XObject } from '../..';
import { common, kernel, model, schema } from '../../../base';
import { IPeriod, Period } from './period';

export interface PeriodResult {
  data: IPeriod[];
  success: boolean;
  total: number;
}

/** 财务接口 */
export interface IFinancial extends common.Emitter {
  /** 归属对象 */
  space: IBelong;
  /** 元数据 */
  metadata: schema.XFinancial | undefined;
  /** 初始化结账月 */
  initialized: string | undefined;
  /** 当前账期 */
  current: string | undefined;
  /** 统计维度 */
  species: schema.XProperty | undefined;
  /** 统计字段 */
  fields: schema.XProperty[];
  /** 缓存 */
  cache: XObject<schema.Xbase>;
  /** 账期集合 */
  coll: XCollection<schema.XPeriod>;
  /** 期数集合 */
  periods: IPeriod[];
  /** 初始化账期 */
  initialize(period: string): Promise<void>;
  /** 设置当前账期 */
  setCurrent(period: string): Promise<void>;
  /** 清空结账日期 */
  clear(): Promise<void>;
  /** 设置总账统计维度（分类型、字典型） */
  setSpecies(species: schema.XProperty): Promise<void>;
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
  summary(period: string): Promise<any[]>;
}

export class Financial extends common.Emitter implements IFinancial {
  constructor(belong: IBelong) {
    super();
    this.space = belong;
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
  metadata: schema.XFinancial | undefined;
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
  get cache(): XObject<schema.Xbase> {
    return this.space.cacheObj;
  }
  async loadContent(): Promise<void> {
    const data = await this.cache.get<schema.XFinancial>('financial');
    if (data) {
      this.metadata = data;
    }
    this.cache.subscribe('financial', (res: schema.XFinancial) => {
      this.metadata = res;
      this.changCallback();
    });
    this.cache.subscribe('financial.initialized', (res: string) => {
      if (this.metadata) {
        this.metadata.initialized = res;
        this.changCallback();
      }
    });
    this.cache.subscribe('financial.current', (res: string) => {
      if (this.metadata) {
        this.metadata.current = res;
        this.changCallback();
      }
    });
    this.cache.subscribe('financial.species', (res: schema.XProperty) => {
      if (this.metadata) {
        this.metadata.species = res;
        this.changCallback();
      }
    });
    this.cache.subscribe('financial.fields', (res: schema.XProperty[]) => {
      if (this.metadata) {
        this.metadata.fields = res;
        this.changCallback();
      }
    });
  }
  async setSpecies(species: schema.XProperty): Promise<void> {
    if (await this.cache.set('financial.species', species)) {
      await this.cache.notity('financial.species', species, true, false);
    }
  }
  async setFields(fields: schema.XProperty[]): Promise<void> {
    if (await this.cache.set('financial.fields', fields)) {
      await this.cache.notity('financial.fields', fields, true, false);
    }
  }
  async initialize(period: string): Promise<void> {
    if (await this.cache.set('financial.initialized', period)) {
      await this.cache.notity('financial.initialized', period, true, false);
    }
  }
  async setCurrent(period: string) {
    if (await this.cache.set('financial.current', period)) {
      await this.cache.notity('financial.current', period, true, false);
    }
  }
  async clear(): Promise<void> {
    if (await this.cache.set('financial', {})) {
      await this.cache.notity('financial', {}, true, false);
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
      snapshot: false,
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
  async summary(period: string): Promise<any[]> {
    const speciesItems = await this.loadSpecies();
    if (!this.species) {
      return [];
    }
    const _id = `T${this.species.id}`;
    let group: any = {
      key: _id,
    };
    this.fields.map((item) => {
      const key = `T${item.id}`;
      group[key] = { _sum_: '$' + key };
    });
    let options = [
      {
        match: {
          belongId: this.space.id,
          [_id]: { _ne_: null },
        },
      },
      {
        group: group,
      },
      { limit: speciesItems.length },
    ];
    const result = await kernel.collectionAggregate(
      this.space.id,
      [this.space.id],
      '_system-things_' + period,
      options,
    );
    return result.data;
  }
}
