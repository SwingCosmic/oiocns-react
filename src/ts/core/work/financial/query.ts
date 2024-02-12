import { IFinancial, ItemSummary } from '.';
import { IBelong, IEntity, XCollection } from '../..';
import { List, common, kernel, model, schema } from '../../../base';
import { Entity } from '../../public';

type DimensionMap<T> = Map<string, DimensionMap<T> | any>;
interface Context {
  before: any;
  after: any;
  change: any;
}

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
  /** 更新 */
  update(metadata: schema.XQuery): Promise<boolean>;
  /** 删除 */
  remove(): Promise<boolean>;
  /** 加载所有分类项 */
  loadSpecies(reload?: boolean): Promise<{ [key: string]: schema.XSpeciesItem[] }>;
  /** 统计某一时刻快照按统计维度的汇总值 */
  summary(collName: string): Promise<DimensionMap<any>>;
  /** 统计变动的汇总值 */
  summaryChange(period: string): Promise<DimensionMap<any>>;
  /** 统计区间的汇总至 */
  summaryRange(start: string, end: string): Promise<common.Tree<ItemSummary>>;
  /** 读取快照 */
  findSnapshot(snapshotId: string): Promise<schema.XSnapshot | undefined>;
  /** 加载明细数据 */
  loadChanges(
    between: [string, string],
    node: common.Node<ItemSummary>,
    field: schema.XProperty,
    symbol: number,
    offset: number,
    limit: number,
  ): Promise<model.LoadResult<schema.XChange[]>>;
  /** 递归汇总分类树 */
  recursion<T>(
    res: { [key: string]: schema.XSpeciesItem[] },
    path: string,
    summary: (path: string, context?: T) => void,
    context?: T,
    build?: (item: schema.XSpeciesItem, context?: T) => T,
  ): void;
}

export class Query extends Entity<schema.XQuery> implements IQuery {
  constructor(metadata: schema.XQuery, financial: IFinancial) {
    super(metadata, []);
    this.financial = financial;
    this.changeColl = this.space.resource.genColl('_system-things-changed');
    this.snapshotColl = this.space.resource.genColl('_system-things-snapshot');
  }
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
  async summary(collName: string): Promise<DimensionMap<any>> {
    const data = new Map<string, any>();
    if (this.fields.length == 0) {
      return data;
    }
    let match: any = {
      belongId: this.space.id,
      [this.species.id]: { _ne_: null },
    };
    this.dimensions.forEach((item) => {
      match[item.id] = { _ne_: null };
    });
    let group: any = {
      key: [this.species.id, ...this.dimensions.map((item) => item.id)],
    };
    this.fields.map((item) => {
      group[item.id] = { _sum_: '$' + item.id };
    });
    let options = [
      { match: match },
      { group: group },
      { limit: Math.max(...Object.values(this.speciesItems).map((item) => item.length)) },
    ];
    const result = await kernel.collectionAggregate(
      this.space.id,
      [this.space.id],
      collName,
      options,
    );
    if (result.success && Array.isArray(result.data)) {
      const dimensions = [this.species, ...this.dimensions];
      for (const item of result.data) {
        let dimension = data;
        for (let index = 0; index < dimensions.length; index++) {
          const property = dimensions[index];
          const value = item[property.id];
          if (!dimension.has(property.id)) {
            if (index == dimensions.length - 1) {
              dimension.set(value, item);
            } else {
              dimension.set(value, new Map<string, any>());
            }
          }
          dimension = dimension.get(value);
        }
      }
    }
    return data;
  }
  async summaryChange(period: string): Promise<DimensionMap<any>> {
    const data = new Map<string, any>();
    if (this.fields.length == 0) {
      return data;
    }
    const match: any = {
      belongId: this.space.id,
      changeTime: period,
      [this.species.id]: { _ne_: null },
    };
    this.dimensions.forEach((item) => {
      match[item.id] = { _ne_: null };
    });
    let options = [
      { match: match },
      {
        group: {
          key: [
            this.species.id,
            ...this.dimensions.map((item) => item.id),
            'propId',
            'symbol',
          ],
          change: { _sum_: '$change' },
        },
      },
      { limit: Math.max(...Object.values(this.speciesItems).map((item) => item.length)) },
    ];
    const result = await kernel.collectionAggregate(
      this.space.id,
      [this.space.id],
      '_system-things-changed',
      options,
    );
    if (result.success && Array.isArray(result.data)) {
      const dimensions = [this.species, ...this.dimensions];
      for (const item of result.data) {
        let dimension = data;
        for (let index = 0; index < dimensions.length; index++) {
          const property = dimensions[index];
          const value = item[property.id];
          if (!dimension.has(value)) {
            dimension.set(value, new Map<string, any>());
          }
          dimension = dimension.get(value);
        }
        if (!dimension.has(item.propId)) {
          dimension.set(item.propId, new Map<number, any>());
        }
        const prop = dimension.get(item.propId)!;
        prop.set(item.symbol, item.change);
      }
    }
    return data;
  }
  recursion<T>(
    res: { [key: string]: schema.XSpeciesItem[] },
    path: string,
    summary: (path: string, context?: T) => void,
    context?: T,
    build?: (item: schema.XSpeciesItem, context?: T) => T,
    index: number = 0,
  ) {
    if (index == this.dimensions.length) {
      summary(path, context);
      return;
    }
    const items = res[this.dimensions[index].speciesId] ?? [];
    for (const item of items) {
      const next = build?.(item, context);
      this.recursion(res, path + '-' + item.id, summary, next, build, index + 1);
    }
  }
  async summaryRange(start: string, end: string): Promise<common.Tree<ItemSummary>> {
    const res = await this.loadSpecies();

    const thing = '_system-things';
    const before = thing + '_' + this.financial.getOffsetPeriod(start, -1);
    const beforeMap = await this.summary(before);
    const changeMap = await this.summaryChange(end);
    const after = this.financial.current == end ? thing : thing + '_' + end;
    const afterMap = await this.summary(after);

    const nodes: ItemSummary[] = [];
    const speciesItems = res[this.species.speciesId] ?? [];
    for (let index = 0; index < speciesItems.length; index++) {
      const value = 'S' + speciesItems[index].id;
      const one: ItemSummary = { ...speciesItems[index] };
      const before = beforeMap.get(value);
      const after = afterMap.get(value);
      const change = changeMap.get(value);
      this.recursion<Context>(
        res,
        'summary-',
        (path, context) => {
          const { before, after, change } = context!;
          for (const field of this.fields) {
            one['before-' + path + field.id] = Number(before?.[field.id] ?? 0);
            one['after-' + path + field.id] = Number(after?.[field.id] ?? 0);
            one['plus-' + path + field.id] = Number(change?.get(field.id)?.get(1) ?? 0);
            one['minus-' + path + field.id] = Number(change?.get(field.id)?.get(-1) ?? 0);
          }
        },
        { before, after, change },
        (item, context) => {
          const { before, after, change } = context!;
          return {
            before: before?.get(item.id),
            after: after?.get(item.id),
            change: change?.get(item.id),
          };
        },
      );
      nodes.push(one);
    }
    const tree = new common.AggregateTree(
      nodes,
      (item) => item.id,
      (item) => item.parentId,
    );
    tree.summary((pre, cur) => {
      this.recursion(res, 'summary-', (path) => {
        for (const field of this.fields) {
          pre['before-' + path + field.id] += cur['before-' + path + field.id];
          pre['after-' + path + field.id] += cur['after-' + path + field.id];
          pre['plus-' + path + field.id] += cur['plus-' + path + field.id];
          pre['minus-' + path + field.id] += cur['minus-' + path + field.id];
        }
      });
      return pre;
    });
    return tree;
  }
  async loadChanges(
    between: [string, string],
    node: common.Node<ItemSummary>,
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
  private recursionNodes(node: common.Node<ItemSummary>) {
    const res: string[] = ['S' + node.id];
    for (const child of node.children) {
      res.push(...this.recursionNodes(child));
    }
    return res;
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
