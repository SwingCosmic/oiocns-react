import { XOperationLog } from '@/ts/base/schema';
import { IBelong, IEntity, IFinancial, XCollection } from '../..';
import { kernel, schema } from '../../../base';
import { Entity } from '../../public';

type DepreciationType = 'Calculate' | 'Confirm' | 'Revoke';

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
  /** 获取上一个月日期 */
  getPrePeriod(): string;
  /** 获取下一个月日期 */
  getNextPeriod(): string;
  /** 计提折旧（确认） */
  depreciation(type: DepreciationType): Promise<XOperationLog | undefined>;
  /** 月结账 */
  monthlySettlement(): Promise<void>;
  /** 试算平衡 */
  trialBalance(): Promise<void>;
  /** 加載操作日志 */
  loadOperationLog(): Promise<XOperationLog | undefined>;
}

export class Period extends Entity<schema.XPeriod> implements IPeriod {
  constructor(metadata: schema.XPeriod, financial: IFinancial) {
    super(metadata, []);
    this.space = financial.space;
    this.financial = financial;
    this.operationColl = this.space.resource.genColl('operation-log');
  }
  speciesLoaded: boolean = false;
  operationColl: XCollection<schema.XOperationLog>;
  space: IBelong;
  financial: IFinancial;
  speciesItems: { [key: string]: schema.XSpeciesItem[] } = {};
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
  async depreciation(
    depreciationType: DepreciationType,
  ): Promise<schema.XOperationLog | undefined> {
    const res = await kernel.depreciationThing(this.space.id, [this.space.id], {
      id: this.metadata.id,
      type: depreciationType,
    });
    if (res.success) {
      const updated = { ...this.metadata, operationId: res.data.id };
      await this.financial.periodColl.notity({ operate: 'update', data: updated });
      return res.data;
    }
  }
  async loadOperationLog(): Promise<XOperationLog | undefined> {
    if (this.metadata.operationId) {
      const result = await this.operationColl.loadResult({
        options: {
          match: { id: this.metadata.operationId },
        },
      });
      if (result.success && result.data && result.data.length > 0) {
        return result.data[0];
      }
    }
  }
  async monthlySettlement(): Promise<void> {
    if (!this.deprecated) {
      throw new Error('未折旧，无法结账！');
    }
    await this.trialBalance();
    await this.update({ ...this.metadata, closed: true });
    await this.toNextPeriod();
  }
  async trialBalance(): Promise<void> {
    await this.update({ ...this.metadata });
  }
  getPrePeriod(): string {
    return this.financial.getOffsetPeriod(this.period, -1);
  }
  getNextPeriod(): string {
    return this.financial.getOffsetPeriod(this.period, 1);
  }
  async toNextPeriod(): Promise<void> {
    await this.financial.createPeriod(this.getNextPeriod());
  }
  async update(metadata: schema.XPeriod): Promise<void> {
    if (await this.financial.periodColl.replace(metadata)) {
      await this.financial.periodColl.notity({ operate: 'update', data: metadata });
    }
  }
}
