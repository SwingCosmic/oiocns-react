import { IFinancial } from '..';
import { IBelong, IEntity, XCollection } from '../../..';
import { common, model, schema } from '../../../../base';
import { Entity } from '../../../public';
import { ISummary, SumItem, Summary } from './summary';

export type DimensionMap<T> = Map<string, DimensionMap<T> | any>;

export interface IQuery extends IEntity<schema.XQuery> {
  /** 元数据 */
  metadata: schema.XQuery;
  /** 归属空间 */
  space: IBelong;
  /** 财务 */
  financial: IFinancial;
  /** 分类维度 */
  species: model.FieldModel;
  /** 统计维度 */
  dimensions: model.FieldModel[];
  /** 统计字段 */
  fields: model.FieldModel[];
  /** 统计对象 */
  summary: ISummary;
  /** 更新 */
  update(metadata: schema.XQuery): Promise<boolean>;
  /** 删除 */
  remove(): Promise<boolean>;
  /** 读取快照 */
  findSnapshot(snapshotId: string): Promise<schema.XSnapshot | undefined>;
  /** 总账 */
  ledgerSummary(start: string, end: string): Promise<common.Tree<SumItem>>;
  /** 加载分类 */
  loadSpecies(reload?: boolean): Promise<{ [key: string]: schema.XSpeciesItem[] }>;
}

export class Query extends Entity<schema.XQuery> implements IQuery {
  constructor(metadata: schema.XQuery, financial: IFinancial) {
    super(metadata, []);
    this.financial = financial;
    this.snapshotColl = this.space.resource.genColl('_system-things-snapshot');
    this.summary = new Summary(financial.space);
    this.species = { ...metadata.species, id: 'T' + metadata.species.id };
    this.dimensions = metadata.dimensions.map((item) => {
      return { ...item, id: 'T' + item.id };
    });
    this.fields = metadata.fields.map((item) => {
      return { ...item, id: 'T' + item.id };
    });
  }
  summary: ISummary;
  financial: IFinancial;
  speciesLoaded: boolean = false;
  speciesItems: { [key: string]: schema.XSpeciesItem[] } = {};
  snapshotColl: XCollection<schema.XSnapshot>;
  species: model.FieldModel;
  dimensions: model.FieldModel[];
  fields: schema.XProperty[];
  get allDimension(): model.FieldModel[] {
    return [this.species, ...this.dimensions];
  }
  get space(): IBelong {
    return this.financial.space;
  }
  async update(metadata: schema.XQuery): Promise<boolean> {
    const result = await this.financial.queryColl.replace({
      ...this.metadata,
      ...metadata,
      typeName: '总账',
    });
    if (result) {
      this.setMetadata(result);
      return await this.financial.queryColl.notity({ operate: 'update', data: result });
    }
    return false;
  }
  async remove(): Promise<boolean> {
    const result = await this.financial.queryColl.remove(this.metadata);
    if (result) {
      return await this.financial.queryColl.notity({
        operate: 'remove',
        data: this.metadata,
      });
    }
    return false;
  }
  async loadSpecies(reload?: boolean): Promise<{ [key: string]: schema.XSpeciesItem[] }> {
    if (!this.speciesLoaded || reload) {
      this.speciesLoaded = true;
      const speciesIds = [this.metadata.species, ...this.metadata.dimensions].map(
        (item) => item.speciesId,
      );
      this.speciesItems = await this.financial.loadSpecies(speciesIds);
    }
    return this.speciesItems;
  }
  async ledgerSummary(start: string, end: string): Promise<common.Tree<SumItem>> {
    const speciesItems = await this.loadSpecies();
    let limit = Math.max(...Object.values(this.speciesItems).map((item) => item.length));
    const getMonthParams = (month: string) => {
      let collName = '_system-things';
      if (month != this.financial.current) {
        collName = collName + '_' + month;
      }
      return {
        collName: collName,
        match: { belongId: this.space.id },
        dimensions: this.allDimension.map((item) => item.id),
        sumFields: this.fields.map((item) => item.id),
        limit: limit,
      };
    };
    const getSymbolParams = (symbol: number) => {
      return {
        collName: '_system-things-changed',
        match: {
          belongId: this.space.id,
          changeTime: { _gte_: this.financial.getOffsetPeriod(start, 1), _lte_: end },
          symbol: symbol,
        },
        dimensions: [...this.allDimension.map((item) => item.id), 'propId'],
        sumFields: ['change'],
        limit: limit,
      };
    };
    return this.summary.summaries({
      speciesId: this.metadata.species.speciesId,
      dimensions: this.dimensions.map((item) => item.id),
      speciesItems: speciesItems,
      fields: this.fields.map((item) => item.id),
      columns: [
        {
          key: 'before',
          title: '期初',
          params: getMonthParams(start),
        },
        {
          key: 'plus',
          title: '增加',
          params: getSymbolParams(1),
        },
        {
          key: 'minus',
          title: '减少',
          params: getSymbolParams(-1),
        },
        {
          key: 'after',
          title: '期末',
          params: getMonthParams(end),
        },
      ],
    });
  }
  async findSnapshot(snapshotId: string): Promise<schema.XSnapshot | undefined> {
    const result = await this.snapshotColl.loadResult({
      options: { match: { id: snapshotId } },
    });
    if (result.success && result.data && result.data.length > 0) {
      return result.data[0];
    }
  }
}
