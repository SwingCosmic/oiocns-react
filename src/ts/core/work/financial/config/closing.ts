import { schema } from '@/ts/base';
import { IFinancial } from '..';
import { XCollection } from '@/utils/excel';
import { Emitter } from '@/ts/base/common';
import { IPeriod } from '../period';

export interface IClosingOptions extends Emitter {
  /** 元数据 */
  options: schema.XClosingOption[];
  /** 财务 */
  financial: IFinancial;
  /** 结账科目集合 */
  optionsColl: XCollection<schema.XClosingOption>;
  /** 加载科目配置 */
  loadOptions(reload?: boolean): Promise<schema.XClosingOption[]>;
  /** 创建一个科目 */
  create(option: schema.XClosingOption): Promise<schema.XClosingOption | undefined>;
  /** 更ing一个科目 */
  update(option: schema.XClosingOption): Promise<schema.XClosingOption | undefined>;
  /** 删除一个科目 */
  remove(option: schema.XClosingOption): Promise<boolean>;
  /** 生成账期科目 */
  generatePeriodOptions(period: IPeriod): Promise<schema.XClosing[]>;
}

export class ClosingOptions extends Emitter implements IClosingOptions {
  constructor(financial: IFinancial) {
    super();
    this.financial = financial;
    this.options = [];
    this.optionsColl = financial.space.resource.genColl('financial-closing-options');
    this.optionsColl.subscribe([this.key], (result) => {
      switch (result.operate) {
        case 'insert':
          this.options.unshift(result.data);
          break;
        case 'update':
          this.options.forEach((item) => {
            if (result.data.id == item.id) {
              Object.assign(item, result.data);
            }
          });
          break;
        case 'remove':
          this.options = this.options.filter((item) => item.id != result.data.id);
          break;
      }
      this.changCallback();
    });
  }
  get key() {
    return this.financial.key + '-closing-options';
  }
  options: schema.XClosingOption[];
  financial: IFinancial;
  optionsColl: XCollection<schema.XClosingOption>;
  optionLoaded: boolean = false;
  async loadOptions(
    reload?: boolean | undefined,
    skip = 0,
  ): Promise<schema.XClosingOption[]> {
    if (reload || !this.optionLoaded) {
      this.optionLoaded = true;
      if (skip == 0) {
        this.options = [];
      }
      const take = 100;
      const res = await this.optionsColl.loadResult({
        skip: skip,
        take: take,
      });
      if (res.success) {
        if (res.data && res.data.length > 0) {
          this.options.push(...res.data);
          if (this.options.length < res.totalCount && res.data.length === take) {
            await this.loadOptions(true, this.options.length);
          }
        }
      }
    }
    return this.options;
  }
  async create(
    option: schema.XClosingOption,
  ): Promise<schema.XClosingOption | undefined> {
    const result = await this.optionsColl.insert(option);
    if (result) {
      await this.optionsColl.notity({ data: result, operate: 'insert' });
      return result;
    }
  }
  async update(
    option: schema.XClosingOption,
  ): Promise<schema.XClosingOption | undefined> {
    const result = await this.optionsColl.replace(option);
    if (result) {
      await this.optionsColl.notity({ data: result, operate: 'update' });
      return result;
    }
  }
  async remove(option: schema.XClosingOption): Promise<boolean> {
    const result = await this.optionsColl.remove(option);
    if (result) {
      return await this.optionsColl.notity({ data: result, operate: 'remove' });
    }
    return result;
  }
  async generatePeriodOptions(period: IPeriod): Promise<schema.XClosing[]> {
    await this.loadOptions();
    return this.options.map((item) => {
      return {
        accounting: item.accounting,
        accountingValue: item.accountingValue,
        amount: item.amount,
        financial: item.financial,
        periodId: period.id,
        balanced: false,
        assetStartAmount: 0,
        assetEndAmount: 0,
        financialAmount: 0,
      } as schema.XClosing;
    });
  }
}
