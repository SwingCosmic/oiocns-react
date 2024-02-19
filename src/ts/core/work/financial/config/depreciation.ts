import { IFinancial } from '..';
import { schema, model } from '../../../../base';
import { XObject } from '../../../public/object';

/** 配置字段 */
export type ConfigField = keyof schema.XConfiguration;

export interface IConfiguration {
  /** 元数据 */
  metadata?: schema.XConfiguration;
  /** 财务 */
  financial: IFinancial;
  /** 分类维度 */
  dimensions: model.FieldModel[];
  /** 折旧字段 */
  accumulatedDepreciation: model.FieldModel | undefined;
  /** 会计科目字段 */
  accounting: model.FieldModel | undefined;
  /** 加载内容 */
  loadContent(): Promise<void>;
  /** 检查折旧配置 */
  checkConfig(): void;
  /** 设置元数据 */
  setMetadata(config: schema.XConfiguration): Promise<void>;
  /** 设置会计科目字段 */
  setAccounting(prop: schema.XProperty): Promise<void>;
  /** 加载分类 */
  loadSpecies(reload?: boolean): Promise<{ [key: string]: schema.XSpeciesItem[] }>;
}

export class Configuration implements IConfiguration {
  constructor(financial: IFinancial, metadata?: schema.XConfiguration) {
    this.financial = financial;
    this.metadata = metadata;
    this.cache = new XObject(financial.space.metadata, this.key, [], [this.key]);
  }
  speciesLoaded: boolean = false;
  financial: IFinancial;
  metadata?: schema.XConfiguration;
  cache: XObject<schema.XConfiguration>;
  speciesItems: { [key: string]: schema.XSpeciesItem[] } = {};
  get key() {
    return 'depreciation-config';
  }
  get dimensions() {
    return (this.metadata?.dimensions ?? []).map((item) => {
      return { ...item, id: 'T' + item.id };
    });
  }
  get accumulatedDepreciation() {
    return this.metadata?.accumulatedDepreciation
      ? {
          ...this.metadata.accumulatedDepreciation,
          id: 'T' + this.metadata.accumulatedDepreciation.id,
        }
      : undefined;
  }
  get accounting() {
    return this.metadata?.accounting
      ? {
          ...this.metadata.accounting,
          id: 'T' + this.metadata.accounting.id,
        }
      : undefined;
  }
  async loadContent(): Promise<void> {
    const config = await this.cache.get<schema.XConfiguration>('');
    if (config) {
      this.metadata = config;
    }
    this.cache.subscribe('average', (res: schema.XConfiguration) => {
      this.metadata = res;
      this.financial.changCallback();
    });
    this.cache.subscribe('accounting', (res: schema.XProperty) => {
      if (!this.metadata) {
        this.metadata = {} as schema.XConfiguration;
      }
      this.metadata.accounting = res;
      this.financial.changCallback();
    });
  }
  checkConfig(): void {
    if (!this.metadata) {
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
      if (!this.metadata[field]) {
        throw new Error('折旧模板配置不全！');
      }
    }
  }
  async setMetadata(config: schema.XConfiguration): Promise<void> {
    if (await this.cache.set('', config)) {
      await this.cache.notity('average', config, true, false);
    }
  }
  async setAccounting(prop: schema.XProperty): Promise<void> {
    if (await this.cache.set('accounting', prop)) {
      await this.cache.notity('accounting', prop, true, false);
    }
  }
  async loadSpecies(
    reload: boolean = false,
  ): Promise<{ [key: string]: schema.XSpeciesItem[] }> {
    if (!this.speciesLoaded || reload) {
      this.speciesLoaded = true;
      const speciesIds = this.metadata?.dimensions.map((item) => item.speciesId);
      this.speciesItems = await this.financial.loadSpecies(speciesIds ?? []);
    }
    return this.speciesItems;
  }
}
