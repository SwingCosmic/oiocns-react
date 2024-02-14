import { IStorage, XCollection } from '../..';
import { schema, model } from '../../../base';

export interface IDataManager {
  /** 数据核 */
  store: IStorage;
  /** 集合 */
  definedColl: XCollection<schema.XDefinedColl>;
  /** 创建集合 */
  createColl(coll: schema.XDefinedColl): Promise<schema.XDefinedColl | undefined>;
  /** 删除集合 */
  removeColl(coll: schema.XDefinedColl): Promise<boolean>;
  /** 加载集合 */
  loadColl(take: number, skip: number): Promise<model.LoadResult<schema.XDefinedColl[]>>;
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

  async loadColl(
    take: number,
    skip: number,
  ): Promise<model.LoadResult<schema.XDefinedColl[]>> {
    return await this.definedColl.loadResult({
      take: take,
      skip: skip,
      requireTotalCount: true,
    });
  }
}
