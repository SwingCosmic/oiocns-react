import { IBelong, IForm, XCollection } from '../..';
import { common, kernel, schema } from '../../../base';
import { XObject } from '../../public/object';
import { Form } from '../../thing/standard/form';
import { IPeriod, Period } from './period';
import { IQuery, Query } from './query';

/** 配置字段 */
export type ConfigField = keyof schema.XDepreciationConfig;

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
  /** 折旧配置 */
  depreciationConfig: schema.XDepreciationConfig | undefined;
  /** 缓存 */
  financialCache: XObject<schema.Xbase>;
  /** 账期集合 */
  periodColl: XCollection<schema.XPeriod>;
  /** 账期数据 */
  periods: IPeriod[];
  /** 当前查询方案 */
  query: IQuery | undefined;
  /** 查询方案集合 */
  queryColl: XCollection<schema.XQuery>;
  /** 查询集合 */
  queries: IQuery[];
  /** 查询物的表单 */
  form: IForm | undefined;
  /** 获取偏移的期数 */
  getOffsetPeriod(period: string, offset: number): string;
  /** 初始化账期 */
  setInitialize(period: string): Promise<void>;
  /** 设置当前账期 */
  setCurrent(period: string): Promise<void>;
  /** 设置查询条件 */
  setQuery(query: schema.XQuery): Promise<void>;
  /** 设置查询条件 */
  setForm(form: schema.XForm): Promise<void>;
  /** 设置折旧配置 */
  setDepreciationConfig(config: schema.XDepreciationConfig): Promise<void>;
  /** 检查折旧配置 */
  checkConfig(): void;
  /** 清空结账日期 */
  clear(): Promise<void>;
  /** 加载分类明细项 */
  loadSpeciesItems(speciesId: string): Promise<schema.XSpeciesItem[]>;
  /** 加载财务数据 */
  loadContent(): Promise<void>;
  /** 加载账期 */
  loadPeriods(reload?: boolean): Promise<IPeriod[]>;
  /** 加载查询方案 */
  loadQueries(reload?: boolean): Promise<IQuery[]>;
  /** 加载表单 */
  loadForm(reload?: boolean): Promise<IForm | undefined>;
  /** 创建查询 */
  createQuery(metadata: schema.XQuery): Promise<schema.XQuery | undefined>;
  /** 生成账期 */
  createPeriod(period: string): Promise<void>;
  /** 生成快照 */
  createSnapshots(period: string): Promise<void>;
}

export class Financial extends common.Emitter implements IFinancial {
  constructor(belong: IBelong) {
    super();
    this.space = belong;
    this.metadata = {} as schema.XFinancial;
    this.financialCache = new XObject(
      belong.metadata,
      'target-financial',
      [],
      [this.key],
    );
    this.configCache = new XObject(
      belong.metadata,
      'depreciation-config',
      [],
      [this.key],
    );
    this.periodColl = this.space.resource.genColl('financial-period');
    this.queryColl = this.space.resource.genColl('data-query');
    this.periodColl.subscribe([this.key + '-period'], (result) => {
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
    this.queryColl.subscribe([this.key + '-query'], (result) => {
      switch (result.operate) {
        case 'insert':
          this.queries.unshift(new Query(result.data, this));
          break;
        case 'update':
          this.queries.forEach((item) => {
            if (result.data.id == item.id) {
              item.updateMetadata(result.data);
            }
          });
          break;
        case 'remove':
          this.queries = this.queries.filter((item) => item.id != result.data.id);
          break;
      }
      this.changCallback();
    });
  }
  form: IForm | undefined;
  query: IQuery | undefined;
  depreciationConfig: schema.XDepreciationConfig | undefined;
  financialCache: XObject<schema.Xbase>;
  configCache: XObject<schema.XDepreciationConfig>;
  metadata: schema.XFinancial;
  space: IBelong;
  periods: IPeriod[] = [];
  periodLoaded: boolean = false;
  periodColl: XCollection<schema.XPeriod>;
  queries: IQuery[] = [];
  queryLoaded: boolean = false;
  queryColl: XCollection<schema.XQuery>;
  formLoaded: boolean = false;
  get key() {
    return this.space.key + '-financial';
  }
  get initialized(): string | undefined {
    return this.metadata?.initialized;
  }
  get current(): string | undefined {
    return this.metadata?.current;
  }
  async loadContent(): Promise<void> {
    const financial = await this.financialCache.get<schema.XFinancial>('');
    if (financial) {
      this.metadata = financial;
    }
    const config = await this.configCache.get<schema.XDepreciationConfig>('');
    if (config) {
      this.depreciationConfig = config;
    }
    this.financialCache.subscribe('financial', (res: schema.XFinancial) => {
      this.metadata = res;
      this.changCallback();
    });
    this.financialCache.subscribe('initialized', (res: string) => {
      this.metadata.initialized = res;
      this.changCallback();
    });
    this.financialCache.subscribe('current', (res: string) => {
      this.metadata.current = res;
      this.changCallback();
    });
    this.financialCache.subscribe('query', (res: string) => {
      this.metadata.query = res;
      for (const query of this.queries) {
        if (query.id == res) {
          this.query = query;
          break;
        }
      }
      this.changCallback();
    });
    this.financialCache.subscribe('form', (res: schema.XForm) => {
      this.form = new Form(res, this.space.directory);
      this.changCallback();
    });
    this.configCache.subscribe('average', (res: schema.XDepreciationConfig) => {
      this.depreciationConfig = res;
      this.changCallback();
    });
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
  async setInitialize(period: string): Promise<void> {
    if (await this.financialCache.set('initialized', period)) {
      await this.financialCache.notity('initialized', period, true, false);
    }
  }
  async setCurrent(period: string) {
    if (await this.financialCache.set('current', period)) {
      await this.financialCache.notity('current', period, true, false);
    }
  }
  async setDepreciationConfig(config: schema.XDepreciationConfig): Promise<void> {
    if (await this.configCache.set('', config)) {
      await this.configCache.notity('average', config, true, false);
    }
  }
  async setQuery(query: schema.XQuery): Promise<void> {
    if (await this.financialCache.set('query', query.id)) {
      await this.financialCache.notity('query', query.id, true, false);
    }
  }
  async setForm(form: schema.XForm): Promise<void> {
    if (await this.financialCache.set('form', form.id)) {
      await this.financialCache.notity('form', form, true, false);
    }
  }
  async clear(): Promise<void> {
    if (await this.financialCache.set('', {})) {
      await this.financialCache.notity('financial', {}, true, false);
    }
    if (await this.periodColl.removeMatch({})) {
      await this.periodColl.notity({ operate: 'clear' });
    }
    const change = this.space.resource.genColl('_system-things-changed');
    change.removeMatch({});
  }
  checkConfig(): void {
    if (!this.depreciationConfig) {
      throw new Error('未配置折旧模板！');
    }
    const fields: ConfigField[] = [
      'dimensions',
      'depreciationMethod',
      'yearAverageMethod',
      'depreciationStatus',
      'accruingStatus',
      'accruedStatus',
      'originalValue',
      'accumulatedDepreciation',
      'monthlyDepreciationAmount',
      'netWorth',
    ];
    for (const field of fields) {
      if (!this.depreciationConfig[field]) {
        throw new Error('折旧模板配置不全！');
      }
    }
  }
  async createQuery(metadata: schema.XQuery): Promise<schema.XQuery | undefined> {
    const result = await this.queryColl.insert({
      ...metadata,
      typeName: '总账',
    });
    if (result) {
      await this.queryColl.notity({ data: result, operate: 'insert' });
      return result;
    }
  }
  async loadQueries(reload: boolean = false, skip: number = 0): Promise<IQuery[]> {
    if (!this.queryLoaded || reload) {
      this.queryLoaded = true;
      if (skip == 0) {
        this.queries = [];
      }
      const take = 20;
      const res = await this.queryColl.loadResult({
        skip: 0,
        take: take,
        options: {
          match: { typeName: '总账' },
        },
      });
      if (res.success) {
        if (res.data && res.data.length > 0) {
          this.queries = res.data.map((item) => {
            const query = new Query(item, this);
            if (item.id == this.metadata.query) {
              this.query = query;
            }
            return query;
          });
          if (this.queries.length < res.totalCount && res.data.length === take) {
            await this.loadQueries(true, this.queries.length);
          }
        }
      }
    }
    return this.queries;
  }
  async loadPeriods(reload: boolean = false, skip: number = 0): Promise<IPeriod[]> {
    if (!this.periodLoaded || reload) {
      this.periodLoaded = true;
      if (skip == 0) {
        this.periods = [];
      }
      const take = 12 * 6;
      const res = await this.periodColl.loadResult({
        skip: skip,
        take: take,
        options: {
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
  async loadForm(reload?: boolean | undefined): Promise<IForm | undefined> {
    if (!this.formLoaded || reload) {
      if (this.metadata.form) {
        this.formLoaded = true;
        const formId = this.metadata.form;
        const form = await this.space.resource.formColl.loadResult({
          options: { match: { id: formId } },
        });
        if (form.success && form.data && form.data.length > 0) {
          this.form = new Form(form.data[0], this.space.directory);
        }
      }
    }
    return this.form;
  }
  async createPeriod(period: string): Promise<void> {
    const result = await this.periodColl.insert({
      period: period,
      depreciated: false,
      closed: false,
    } as schema.XPeriod);
    if (result) {
      await this.periodColl.notity({ data: result, operate: 'insert' });
    }
  }
  getOffsetPeriod(period: string, offsetMonth: number): string {
    const currentMonth = new Date(period);
    const preMonth = new Date(currentMonth);
    preMonth.setMonth(currentMonth.getMonth() + offsetMonth);
    return common.formatDate(preMonth, 'yyyy-MM');
  }
  async createSnapshots(period: string): Promise<void> {
    await kernel.snapshotThing(this.space.id, [this.space.id], {
      collName: '_system-things',
      dataPeriod: period,
    });
  }
}
