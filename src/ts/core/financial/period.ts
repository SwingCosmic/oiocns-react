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
  /** 是否平衡 */
  balanced: boolean;
  /** 计提折旧 */
  calculateDepreciation(): Promise<void>;
  /** 月结账 */
  monthlySettlement(): Promise<void>;
  /** 试算平衡 */
  trialBalance(): Promise<void>;
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
    return this.metadata.period.substring(5);
  }
  get deprecated() {
    return this.metadata.depreciated;
  }
  get closed() {
    return this.metadata.closed;
  }
  get period() {
    return this.metadata.period;
  }
  get balanced() {
    return this.metadata.balanced;
  }
  async calculateDepreciation(): Promise<void> {
    if (this.closed) {
      throw new Error('已结账，无法计提折旧！');
    }
    await this.update({ ...this.metadata, depreciated: true });
  }
  async monthlySettlement(): Promise<void> {
    if (!this.deprecated) {
      throw new Error('未折旧，无法结账！');
    }
    await this.trialBalance();
    if (!this.balanced) {
      throw new Error('未试算平衡，无法结账！');
    }
    await this.update({ ...this.metadata, closed: true });
    await this.toNextPeriod();
  }
  async trialBalance(): Promise<void> {
    await this.update({ ...this.metadata, balanced: true });
  }
  async toNextPeriod(): Promise<void> {
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
      command.emitterFlag('financial', true);
    }
  }
  async update(metadata: schema.XPeriod): Promise<void> {
    await this.space.resource.periodColl.replace(metadata);
    this.financial.changCallback();
  }
}
