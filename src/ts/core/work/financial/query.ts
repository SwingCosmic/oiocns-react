import { IFinancial } from '.';
import { IBelong, IEntity, XCollection } from '../..';
import { List, common, model, schema } from '../../../base';
import { Entity } from '../../public';
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
  species: schema.XProperty;
  /** 统计维度 */
  dimensions: schema.XProperty[];
  /** 统计字段 */
  fields: schema.XProperty[];
  /** 统计对象 */
  summary: ISummary;
  /** 更新 */
  update(metadata: schema.XQuery): Promise<boolean>;
  /** 删除 */
  remove(): Promise<boolean>;
  /** 加载所有分类项 */
  loadSpecies(reload?: boolean): Promise<{ [key: string]: schema.XSpeciesItem[] }>;
  /** 读取快照 */
  findSnapshot(snapshotId: string): Promise<schema.XSnapshot | undefined>;
  /** 总账 */
  ledgerSummary(start: string, end: string): Promise<common.Tree<SumItem>>;
  /** 加载明细数据 */
  loadChanges(
    between: [string, string],
    node: common.Node<SumItem>,
    field: schema.XProperty,
    symbol: number,
    offset: number,
    limit: number,
  ): Promise<model.LoadResult<schema.XChange[]>>;
}

export class Query extends Entity<schema.XQuery> implements IQuery {
  constructor(metadata: schema.XQuery, financial: IFinancial) {
    super(metadata, []);
    this.financial = financial;
    this.changeColl = this.space.resource.genColl('_system-things-changed');
    this.snapshotColl = this.space.resource.genColl('_system-things-snapshot');
    this.summary = new Summary(financial.space);
  }
  summary: ISummary;
  financial: IFinancial;
  speciesLoaded: boolean = false;
  speciesItems: { [key: string]: schema.XSpeciesItem[] } = {};
  changeColl: XCollection<schema.XChange>;
  snapshotColl: XCollection<schema.XSnapshot>;
  get species(): schema.XProperty {
    return this.metadata.species;
  }
  get dimensions(): schema.XProperty[] {
    return this.metadata.dimensions;
  }
  get fields(): schema.XProperty[] {
    return this.metadata.fields;
  }
  get allDimension(): schema.XProperty[] {
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
      const speciesIds = [this.species, ...this.dimensions].map((item) => item.speciesId);
      const speciesItems = await this.financial.space.resource.speciesItemColl.loadSpace({
        options: { match: { speciesId: { _in_: speciesIds } } },
      });
      const groupItems = new List(speciesItems).GroupBy((item) => item.speciesId);
      for (const speciesId of speciesIds) {
        this.speciesItems[speciesId] = groupItems[speciesId] ?? [];
      }
    }
    return this.speciesItems;
  }
  async loadChanges(
    between: [string, string],
    node: common.Node<SumItem>,
    field: schema.XProperty,
    symbol: number,
    offset: number,
    limit: number,
  ): Promise<model.LoadResult<schema.XChange[]>> {
    return await this.changeColl.loadResult({
      options: {
        match: {
          changeTime: {
            _gte_: between[0],
            _lte_: between[1],
          },
          belongId: this.space.id,
          propId: field.id,
          symbol: symbol,
          [this.species.id]: {
            _in_: this.recursionNodes(node),
          },
        },
      },
      skip: offset,
      limit: limit,
      requireTotalCount: true,
    });
  }
  private recursionNodes(node: common.Node<SumItem>) {
    const res: string[] = ['S' + node.id];
    for (const child of node.children) {
      res.push(...this.recursionNodes(child));
    }
    return res;
  }
  async ledgerSummary(start: string, end: string): Promise<common.Tree<SumItem>> {
    const dimensionsItems = await this.loadSpecies();
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
          changeTime: { _gte_: start, _lte_: end },
          symbol: symbol,
        },
        dimensions: [...this.allDimension.map((item) => item.id), 'propId'],
        sumFields: ['change'],
        limit: limit,
      };
    };
    return this.summary.summaries({
      dimensions: this.dimensions.map((item) => item.id),
      dimensionsItems: dimensionsItems,
      speciesId: this.species.speciesId,
      dimensionFields: this.fields.map((item) => item.id),
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
