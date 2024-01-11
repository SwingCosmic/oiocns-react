import { IBelong, IEntity, IFinancial } from '..';
import { Entity } from '../public';
import { command, schema, common } from './../../base';

export interface IPeriod extends IEntity<schema.XPeriod> {
  /** 归属空间 */
  space: IBelong;
  /** 账期 */
  financial: IFinancial;
  /** 元数据 */
  metadata: schema.XPeriod;
  /** 年度 */
  annual: string;
  /** 月度 */
  monthly: string;
  /** 期间 */
  period: string;
  /** 是否已折旧 */
  deprecated: boolean;
  /** 是否已结账 */
  closed: boolean;
  /** 计提折旧 */
  depreciationCalculating(): Promise<void>;
  /** 月结账 */
  monthlyClosing(): Promise<void>;
  /** 试算平衡 */
  trialBalance(): Promise<void>;
  /** 去往下一个账期 */
  toNextPeriod(): Promise<IPeriod | undefined>;
}

export class Period extends Entity<schema.XPeriod> implements IPeriod {
  constructor(metadata: schema.XPeriod, belong: IBelong, financial: IFinancial) {
    super(metadata, []);
    this.space = belong;
    this.financial = financial;
  }
  space: IBelong;
  financial: IFinancial;
  get annual(): string {
    return this.metadata.period.substring(0, 4);
  }
  get monthly(): string {
    return this.metadata.period.substring(0, 6);
  }
  get deprecated() {
    return this.metadata.depreciated;
  }
  get closed() {
    return this.metadata.closed;
  }
  get period() {
    return this.metadata.period + '-01 00:00:00';
  }
  /** 计提折旧 */
  async depreciationCalculating(): Promise<void> {
    if (this.closed) {
      throw new Error('已结账，无法计提折旧！');
    }
  }
  /** 月结账 */
  async monthlyClosing(): Promise<void> {
    if (!this.deprecated) {
      throw new Error('未折旧，无法结账！');
    }
  }
  /** 试算平衡 */
  async trialBalance(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  async toNextPeriod(): Promise<IPeriod | undefined> {
    const currentMonth = new Date(this.period);
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(currentMonth.getMonth() + 1);
    const period = await this.space.resource.periodColl.insert({
      period: common.formatDate(nextMonth, 'yyyy-MM'),
      data: {},
      depreciated: false,
      closed: false,
    } as schema.XPeriod);
    if (period) {
      this.space.cacheObj.set('financial.currentPeriod', period.period);
      const data = new Period(period, this.space, this.financial);
      this.financial.periods.unshift(data);
      command.emitterFlag('financial', true);
      return data;
    }
  }
}
