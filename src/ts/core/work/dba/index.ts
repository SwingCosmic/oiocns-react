import { IStorage, XCollection } from '../..';
import { schema, model, kernel } from '../../../base';

export const Collections = {
  systemObjects: {
    key: '_system-objects',
    name: '系统对象',
  },
  systemThings: {
    key: '_system-things',
    name: '物',
  },
  systemThingsChanged: {
    key: '_system-things-changed',
    name: '物的变更',
  },
  systemThingsSnapshot: {
    key: '_system-things-snapshot',
    name: '物的快照',
  },
  financialClosingOptions: {
    key: 'financial-closing-options',
    name: '财务结账配置',
  },
  financialClosings: {
    key: 'financial-closings',
    name: '财务结账科目项',
  },
  financialDepreciation: {
    key: 'financial-depreciation',
    name: '折旧临时集合',
  },
  financialPeriod: {
    key: 'financial-period',
    name: '财务账期',
  },
  financialQuery: {
    key: 'financial-query',
    name: '财务查询方案',
  },
  operationLog: {
    key: 'operation-log',
    name: '操作日志',
  },
  resourceDirectory: {
    key: 'resource-directory',
    name: '目录',
  },
  resourceDirectoryTemp: {
    key: 'resource-directory-temp',
    name: '临时目录（附件迁移）',
  },
  resourceFileLink: {
    key: 'resource-file-link',
    name: '文件链接',
  },
  standardApplication: {
    key: 'standard-application',
    name: '标准应用',
  },
  standardDefinedColl: {
    key: 'standard-defined-coll',
    name: '已定义的集合',
  },
  standardForm: {
    key: 'standard-form',
    name: '标准表单',
  },
  standardProperty: {
    key: 'standard-property',
    name: '标准属性',
  },
  standardSpecies: {
    key: 'standard-species',
    name: '标准分类',
  },
  standardSpeciesItem: {
    key: 'standard-species-item',
    name: '标准分类',
  },
  workInstance: {
    key: 'work-instance',
    name: '流程实例',
  },
  workTask: {
    key: 'work-task',
    name: '流程任务',
  },
};

export interface PageParams {
  take: number;
  skip: number;
}

export interface IDataManager {
  /** 数据核 */
  store: IStorage;
  /** 集合 */
  definedColl: XCollection<schema.XDefinedColl>;
  /** 创建集合 */
  createColl(coll: schema.XDefinedColl): Promise<schema.XDefinedColl | undefined>;
  /** 删除集合 */
  removeColl(coll: schema.XDefinedColl): Promise<boolean>;
  /** 加载自定义集合 */
  loadDefinedColl(args: PageParams): Promise<model.LoadResult<schema.XDefinedColl[]>>;
  /** 加载所有集合 */
  loadCollections(belongId: string): Promise<string[]>;
}

export class DataManager implements IDataManager {
  constructor(_store: IStorage) {
    this.store = _store;
    this.definedColl = _store.space.resource.genColl('standard-defined-coll');
  }

  store: IStorage;
  definedColl: XCollection<schema.XDefinedColl>;

  async createColl(coll: schema.XDefinedColl): Promise<schema.XDefinedColl | undefined> {
    coll.id = 'formdata-' + coll.id;
    if (!/^[_a-z-0-9]{5,30}$/.test(coll.id)) {
      throw new Error("集合名称必须是长度为5~30个字符的小写英文字母、数字或('-','_')!");
    }
    return await this.definedColl.replace(coll);
  }

  async removeColl(coll: schema.XDefinedColl): Promise<boolean> {
    return await this.definedColl.remove(coll);
  }

  async loadDefinedColl(
    args: PageParams,
  ): Promise<model.LoadResult<schema.XDefinedColl[]>> {
    return await this.definedColl.loadResult({
      ...args,
      requireTotalCount: true,
    });
  }

  async loadCollections(belongId: string): Promise<string[]> {
    const result = await kernel.collectionList(belongId, []);
    if (result.success) {
      return Object.keys(result.data as any);
    }
    return [];
  }
}
