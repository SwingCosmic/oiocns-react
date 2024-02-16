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
  /** 折旧统计 */
  depreciationSummary(species: schema.XProperty): Promise<common.Tree<SumItem>>;
  /** 加载分类 */
  loadSpecies(reload?: boolean): Promise<{ [key: string]: schema.XSpeciesItem[] }>;
}

export class Period extends Entity<schema.XPeriod> implements IPeriod {
  constructor(metadata: schema.XPeriod, financial: IFinancial) {
    super(metadata, []);
    this.space = financial.space;
    this.financial = financial;
    this.operationColl = this.space.resource.genColl('operation-log');
    this.summary = new Summary(financial.space);
  }
  speciesLoaded: boolean = false;
  operationColl: XCollection<schema.XOperationLog>;
  space: IBelong;
  financial: IFinancial;
  speciesItems: { [key: string]: schema.XSpeciesItem[] } = {};
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
  get dimensions() {
    return this.financial.configuration?.dimensions ?? [];
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
  async loadSpecies(
    reload: boolean = false,
  ): Promise<{ [key: string]: schema.XSpeciesItem[] }> {
    if (!this.speciesLoaded || reload) {
      this.speciesLoaded = true;
      const speciesIds = this.dimensions.map((item) => item.speciesId);
      this.speciesItems = await this.financial.loadSpecies(speciesIds);
    }
    return this.speciesItems;
  }
  async depreciationSummary(species: schema.XProperty): Promise<common.Tree<SumItem>> {
    const configuration = this.financial.configuration;
    if (!configuration) {
      throw new Error('未配置折旧相关信息！');
    }
    const result = await this.loadSpecies();
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
            collName: 'financial-depreciation',
            match: {
              belongId: this.space.id,
              propId: 'T' + configuration.accumulatedDepreciation.id,
            },
            dimensions: [...this.dimensions.map((item) => 'T' + item.id)],
            sumFields: ['change'],
            limit: limit,
          },
        },
      ],
    });
  }
}
