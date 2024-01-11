import { IBelong, XObject } from '..';
import { common, schema } from './../../base';
import { IPeriod, Period } from './period';

/** 财务接口 */
export interface IFinancial extends common.Emitter {
  /** 归属对象 */
  belong: IBelong;
  /** 元数据 */
  metadata: schema.XFinancial | undefined;
  /** 初始化结账月 */
  initializedPeriod: string | undefined;
  /** 当前账期 */
  currentPeriod: string | undefined;
  /** 是否已 */
  /** 账期集合 */
  periods: IPeriod[];
  /** 初始化账期 */
  initialize(period: string): Promise<void>;
  /** 清空结账日期 */
  clear(): Promise<void>;
  /** 加载财务数据 */
  loadFinancial(): Promise<void>;
  /** 加载账期 */
  loadPeriods(take: number): Promise<IPeriod[]>;
  /** 生成初始账期 */
  generatePeriod(): Promise<IPeriod | undefined>;
}

export class Financial extends common.Emitter implements IFinancial {
  constructor(belong: IBelong) {
    super();
    this.belong = belong;
    this.periods = [];
  }
  metadata: schema.XFinancial | undefined;
  belong: IBelong;
  periods: IPeriod[];
  finished: boolean = false;
  get initializedPeriod(): string | undefined {
    return this.metadata?.initializedPeriod;
  }
  get currentPeriod(): string | undefined {
    return this.metadata?.currentPeriod;
  }
  get currentPeriodTime(): string {
    return this.metadata?.currentPeriod + '-01 00:00:00';
  }
  get cache(): XObject<schema.Xbase> {
    return this.belong.cacheObj;
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
  }
  async initialize(period: string): Promise<void> {
    const financial: schema.XFinancial = {
      initializedPeriod: period,
      currentPeriod: period,
      notGeneratedPeriod: true,
    };
    await this.setFinancial(financial);
  }
  private async setFinancial(financial: schema.XFinancial) {
    const success = await this.cache.set('financial', financial);
    if (success) {
      await this.cache.notity('financial', financial, true, false);
    }
  }
  async clear(): Promise<void> {
    await this.setFinancial({} as any);
    await this.belong.resource.periodColl.removeMatch({});
  }
  async loadPeriods(take: number): Promise<IPeriod[]> {
    if (!this.finished) {
      const periods = await this.belong.resource.periodColl.load({
        skip: this.periods.length,
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
      const loaded = periods.map((item) => new Period(item, this.belong, this));
      this.finished = loaded.length < take;
      this.periods.push(...loaded);
      return loaded;
    }
    return [];
  }
  async generatePeriod(): Promise<IPeriod | undefined> {
    if (this.metadata?.notGeneratedPeriod) {
      const period = await this.belong.resource.periodColl.insert({
        period: this.currentPeriod,
        data: {} as schema.XThing,
        snapshot: false,
        depreciated: false,
        closed: false,
      } as schema.XPeriod);
      if (period) {
        const result = new Period(period, this.belong, this);
        this.periods.unshift(result);
        return result;
      }
    }
    this.changCallback();
  }
}
