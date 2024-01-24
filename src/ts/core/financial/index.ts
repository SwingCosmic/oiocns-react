import { IBelong, XObject } from '..';
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
  initializedPeriod: string | undefined;
  /** 当前账期 */
  currentPeriod: string | undefined;
  /** 未生成初始账期 */
  firstGenerated: boolean | undefined;
  /** 账期集合 */
  periods: IPeriod[];
  /** 初始化账期 */
  initialize(period: string): Promise<void>;
  /** 清空结账日期 */
  clear(): Promise<void>;
  /** 加载财务数据 */
  loadFinancial(): Promise<void>;
  /** 加载账期 */
  loadPeriods(reload?: boolean): Promise<IPeriod[]>;
  /** 生成初始账期 */
  generatePeriod(): Promise<void>;
}

export class Financial extends common.Emitter implements IFinancial {
  constructor(belong: IBelong) {
    super();
    this.space = belong;
  }
  metadata: schema.XFinancial | undefined;
  space: IBelong;
  periods: IPeriod[] = [];
  loaded: boolean = false;
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
    return this.space.cacheObj;
  }
  get firstGenerated(): boolean | undefined {
    return this.metadata?.firstGenerated;
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
      firstGenerated: false,
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
    await this.space.resource.periodColl.removeMatch({});
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
          this.periods.push(
            ...res.data.map((item) => new Period(item, this.space, this)),
          );
          if (this.periods.length < res.totalCount && res.data.length === take) {
            await this.loadPeriods(true, this.periods.length);
          }
        }
      }
    }
    return this.periods;
  }
  async generatePeriod(): Promise<void> {
    if (this.metadata && !this.metadata.firstGenerated) {
      await this.space.resource.periodColl.insert({
        period: this.currentPeriod,
        data: {} as schema.XThing,
        snapshot: false,
        depreciated: false,
        closed: false,
      } as schema.XPeriod);
      await this.setFinancial({ ...this.metadata, firstGenerated: true });
    }
    this.changCallback();
  }
}
