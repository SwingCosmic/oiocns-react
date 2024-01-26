import { IBelong, XCollection, XObject } from '..';
import { common, schema } from './../../base';
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
  /** 账期集合 */
  coll: XCollection<schema.XPeriod>;
  /** 缓存对象 */
  periods: IPeriod[];
  /** 初始化账期 */
  initialize(period: string): Promise<void>;
  /** 设置当前账期 */
  setCurrent(period: string): Promise<void>;
  /** 清空结账日期 */
  clear(): Promise<void>;
  /** 加载财务数据 */
  loadFinancial(): Promise<void>;
  /** 加载账期 */
  loadPeriods(reload?: boolean): Promise<IPeriod[]>;
  /** 生成账期 */
  generatePeriod(period: string): Promise<void>;
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
  space: IBelong;
  periods: IPeriod[] = [];
  loaded: boolean = false;
  coll: XCollection<schema.XPeriod>;
  get key() {
    return this.space.key + '-financial';
  }
  get initialized(): string | undefined {
    return this.metadata?.initialized;
  }
  get current(): string | undefined {
    return this.metadata?.current;
  }
  get cache(): XObject<schema.Xbase> {
    return this.space.cacheObj;
  }
  async loadFinancial(): Promise<void> {
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
}
