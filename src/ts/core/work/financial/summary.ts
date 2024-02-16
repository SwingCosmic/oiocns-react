import { IBelong } from '../..';
import { common, kernel, schema } from '../../../base';

export type DataMap<T> = Map<string, DataMap<T> | any>;

export interface SummaryParams {
  collName: string;
  match: { [key: string]: any };
  dimensions: string[];
  sumFields: string[];
  limit: number;
}

export interface SummaryRecursion<T> {
  dimensions: string[];
  dimensionsItems: { [key: string]: schema.XSpeciesItem[] };
  dimensionPath: string;
  index?: number;
  context?: T;
  summary: (dimensionPath: string, context?: T) => void;
  buildNext?: (item: schema.XSpeciesItem, context: T) => T;
}

export interface SummaryColumn {
  key: string;
  title: string;
  params: SummaryParams;
}

export interface SummaryColumns {
  dimensions: string[];
  speciesItems: { [key: string]: schema.XSpeciesItem[] };
  fields: string[];
  speciesId: string;
  columns: SummaryColumn[];
}

export interface SumItem extends schema.XSpeciesItem {
  [field: string]: any;
}

export interface ISummary {
  /** 归属空间 */
  space: IBelong;
  /** 汇总某个指标 */
  summary(params: SummaryParams): Promise<DataMap<any>>;
  /** 汇总所有指标列 */
  summaries(params: SummaryColumns): Promise<common.Tree<SumItem>>;
  /** 递归汇总分类树 */
  summaryRecursion<T>(params: SummaryRecursion<T>): void;
}

export class Summary implements ISummary {
  constructor(space: IBelong) {
    this.space = space;
  }
  space: IBelong;
  async summary(params: SummaryParams): Promise<DataMap<any>> {
    const data: DataMap<any> = new Map();
    if (params.sumFields.length == 0) {
      return data;
    }
    let match = { ...params.match };
    params.dimensions.forEach((item) => {
      match[item] = { _ne_: null };
    });
    let group: any = { key: params.dimensions };
    params.sumFields.forEach((item) => {
      group[item] = { _sum_: '$' + item };
    });
    const result = await kernel.collectionAggregate(
      this.space.id,
      [this.space.id],
      params.collName,
      [{ match }, { group }, { limit: params.limit }],
    );
    if (result.success && Array.isArray(result.data)) {
      for (const item of result.data) {
        let dimension = data;
        for (let index = 0; index < params.dimensions.length; index++) {
          const property = params.dimensions[index];
          const value = item[property];
          if (!dimension.has(value)) {
            if (index == params.dimensions.length - 1) {
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
  summaryRecursion<T>(params: SummaryRecursion<T>) {
    params.index = params.index ?? 0;
    if (params.index == params.dimensions.length) {
      params.summary(params.dimensionPath, params.context);
      return;
    }
    const current = params.dimensions[params.index];
    const items = params.dimensionsItems[current] ?? [];
    for (const item of items) {
      const next = params.context ? params.buildNext?.(item, params.context) : undefined;
      this.summaryRecursion({
        ...params,
        dimensionPath: params.dimensionPath + '-' + item.id,
        context: next,
        index: params.index + 1,
      });
    }
  }
  async summaries(params: SummaryColumns): Promise<common.Tree<SumItem>> {
    const summaryData: DataMap<any> = new Map();
    for (const column of params.columns) {
      const data = await this.summary(column.params);
      summaryData.set(column.key, data);
    }

    const nodes: SumItem[] = [];
    const speciesItems = params.speciesItems[params.speciesId] ?? [];
    for (let index = 0; index < speciesItems.length; index++) {
      const value = 'S' + speciesItems[index].id;
      const one: SumItem = { ...speciesItems[index] };
      const speciesData: DataMap<any> = new Map();
      for (const column of params.columns) {
        speciesData.set(column.key, summaryData.get(column.key)?.get(value) ?? {});
      }
      this.summaryRecursion<DataMap<any>>({
        dimensionsItems: params.speciesItems,
        dimensions: params.dimensions,
        dimensionPath: 'root',
        context: speciesData,
        summary: (path, context) => {
          for (const dimensionField of params.fields) {
            for (const column of params.columns) {
              const key = column.key + '-' + path + '-' + dimensionField;
              for (const sumField of column.params.sumFields) {
                const item = context?.get(column.key);
                if (item instanceof Map) {
                  one[key] = Number(item?.get(dimensionField)?.[sumField] ?? 0);
                } else {
                  one[key] = Number(item?.[dimensionField] ?? 0);
                }
              }
            }
          }
        },
        buildNext: (item, context) => {
          const next: DataMap<any> = new Map();
          for (const column of params.columns) {
            next.set(column.key, context.get(column.key)?.get(item.id) ?? {});
          }
          return next;
        },
      });
      nodes.push(one);
    }
    const tree = new common.AggregateTree(
      nodes,
      (item) => item.id,
      (item) => item.parentId,
    );
    tree.summary((previous, current) => {
      this.summaryRecursion({
        dimensionsItems: params.speciesItems,
        dimensions: params.dimensions,
        dimensionPath: 'root',
        summary: (path) => {
          for (const dimensionField of params.fields) {
            for (const column of params.columns) {
              const key = column.key + '-' + path + '-' + dimensionField;
              previous[key] += current[key];
            }
          }
        },
      });
      return previous;
    });
    return tree;
  }
}
