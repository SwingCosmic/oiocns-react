import { IBelong, IEntity, IFinancial } from '..';
import { Entity } from '../public';
import { common, kernel, schema } from './../../base';

/**
 * 账期
 */
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
  /** 是否已生成快照 */
  snapshot: boolean;
  /** 计提折旧 */
  calculateDepreciation(): Promise<void>;
  /** 月结账 */
  monthlySettlement(): Promise<void>;
  /** 试算平衡 */
  trialBalance(): Promise<void>;
  /** 生成快照 */
  generatingSnapshot(): Promise<void>;
  /** 统计总账 */
  summary(): Promise<void>;
}

export class Period extends Entity<schema.XPeriod> implements IPeriod {
  constructor(metadata: schema.XPeriod, financial: IFinancial) {
    super(metadata, []);
    this.space = financial.space;
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
  get snapshot() {
    return this.metadata.snapshot;
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
  private getNextPeriod(): string {
    const currentMonth = new Date(this.period);
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(currentMonth.getMonth() + 1);
    return common.formatDate(nextMonth, 'yyyy-MM');
  }
  async toNextPeriod(): Promise<void> {
    await this.financial.generatePeriod(this.getNextPeriod());
  }
  async update(metadata: schema.XPeriod): Promise<void> {
    if (await this.financial.coll.replace(metadata)) {
      await this.financial.coll.notity({ operate: 'update', data: metadata });
    }
  }
  async generatingSnapshot(): Promise<void> {
    await kernel.snapshotThing(this.space.id, [this.space.id], {
      collName: '_system-things',
      dataPeriod: this.metadata.period,
    });
    await this.update({ ...this.metadata, snapshot: true });
  }
  async summary(): Promise<void> {
    let group: any = {
      key: 'species',
    };
    this.financial.fields.map((item) => {
      group[item.id] = {
        _sum_: `$${item.id}`,
      };
    });
    let options = {
      match: {
        belongId: this.space.id,
      },
      group,
    };
    console.log("options", options);
    const res = await kernel.collectionAggregate(
      this.space.id,
      [this.space.id],
      '_system_things',
      options,
    );
    console.log(res);
  }
}
