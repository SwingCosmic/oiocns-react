import { XOperationLog } from '@/ts/base/schema';
import { IBelong, IEntity, IFinancial, XCollection } from '../..';
import { common, kernel, schema } from '../../../base';
import { Entity } from '../../public';
import { ISummary, SumItem, Summary } from './summary';

export type Operation = 'Calculate' | 'Confirm' | 'Revoke';
export enum OperationStatus {
  Ready = 1,
  Working,
  Error,
  Stop,
  Completed,
}

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
  /** 汇总接口 */
  summary: ISummary;
  /** 获取上一个月日期 */
  getPrePeriod(): string;
  /** 获取下一个月日期 */
  getNextPeriod(): string;
  /** 计提折旧 */
  depreciation(type: Operation): Promise<XOperationLog | undefined>;
  /** 月结账 */
  monthlySettlement(): Promise<void>;
  /** 试算平衡 */
  trialBalance(): Promise<void>;
  /** 加載操作日志 */
  loadOperationLog(): Promise<XOperationLog | undefined>;
  /** 刷新元数据 */
  loadMetadata(): Promise<schema.XPeriod | undefined>;
  /** 折旧统计 */
  depreciationSummary(species: schema.XProperty): Promise<common.Tree<SumItem>>;
}

export class Period extends Entity<schema.XPeriod> implements IPeriod {
  constructor(metadata: schema.XPeriod, financial: IFinancial) {
    super(metadata, []);
    this.space = financial.space;
    this.financial = financial;
    this.operationColl = this.space.resource.genColl('operation-log');
    this.summary = new Summary(financial.space);
  }
  operationColl: XCollection<schema.XOperationLog>;
  space: IBelong;
  financial: IFinancial;
  summary: ISummary;
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
  async depreciation(operation: Operation): Promise<schema.XOperationLog | undefined> {
    const res = await kernel.depreciationThing(this.space.id, [this.space.id], {
      id: this.metadata.id,
      type: operation,
    });
    if (res.success) {
      this.setMetadata({ ...this.metadata, operationId: res.data.id });
      await this.financial.periodColl.notity({ operate: 'update', data: this.metadata });
      return res.data;
    } else {
      throw new Error(res.msg);
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
  async loadMetadata(): Promise<schema.XPeriod | undefined> {
    const result = await this.financial.periodColl.loadResult({
      options: {
        match: { id: this.metadata.id },
      },
    });
    if (result.success && result.data && result.data.length > 0) {
      this.setMetadata(result.data[0]);
      await this.financial.periodColl.notity({ operate: 'update', data: this.metadata });
      return this.metadata;
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
  async depreciationSummary(species: schema.XProperty): Promise<common.Tree<SumItem>> {
    const configuration = this.financial.configuration.metadata;
    if (!configuration) {
      throw new Error('未配置折旧相关信息！');
    }
    const result = await this.financial.configuration.loadSpecies();
    let limit = Math.max(...Object.values(result).map((item) => item.length));
    return this.summary.summaries({
      speciesId: species.speciesId,
      speciesItems: result,
      dimensions: [],
      fields: ['change'],
      columns: [
        {
          key: 'current',
          title: '期初',
          params: {
            collName: this.metadata.depreciated
              ? '_system-things-changed'
              : 'financial-depreciation',
            match: {
              belongId: this.space.id,
              propId: this.financial.configuration.accumulatedDepreciation?.id,
              instanceId: this.metadata.id,
            },
            dimensions: this.financial.configuration.dimensions.map((item) => item.id),
            sumFields: ['change'],
            limit: limit,
          },
        },
        {
          key: 'plus',
          title: '本期增加',
          params: {
            collName: '_system-things-changed',
            match: {
              belongId: this.space.id,
              propId: this.financial.configuration.accumulatedDepreciation?.id,
              changeTime: this.period,
              instanceId: {
                _ne_: this.metadata.id,
              },
              symbol: 1,
            },
            dimensions: this.financial.configuration.dimensions.map((item) => item.id),
            sumFields: ['change'],
            limit: limit,
          },
        },
        {
          key: 'minus',
          title: '本期减少',
          params: {
            collName: '_system-things-changed',
            match: {
              belongId: this.space.id,
              propId: this.financial.configuration.accumulatedDepreciation?.id,
              changeTime: this.period,
              instanceId: {
                _ne_: this.metadata.id,
              },
              symbol: -1,
            },
            dimensions: this.financial.configuration.dimensions.map((item) => item.id),
            sumFields: ['change'],
            limit: limit,
          },
        },
      ],
    });
  }
}
