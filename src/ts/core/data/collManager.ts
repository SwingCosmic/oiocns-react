import { IBelong, XObject } from '..';
import { common, schema } from '../../base';

/**
 * 归属用户数据管理
 */
export interface ICollManager extends common.Emitter {
  /** 归属单位 */
  space: IBelong;
  /** 用户自定义集合  */
  collections: schema.XColl[];
  /** 加载内容 */
  loadContent(): Promise<void>;
  /** 添加自定义集合 */
  createCollection(collection: schema.XColl): Promise<void>;
}

export class CollManager extends common.Emitter implements ICollManager {
  constructor(space: IBelong) {
    super();
    this.space = space;
    this.cache = space.cacheObj;
  }
  space: IBelong;
  cache: XObject<schema.Xbase>;
  collections: schema.XColl[] = [];
  collectionLoaded: boolean = false;
  async loadContent(): Promise<void> {
    const data = await this.cache.get<schema.XColl[]>('collections');
    if (data) {
      this.collections = data;
    }
    this.cache.subscribe('collections', (res: schema.XColl[]) => {
      this.collections = res;
      this.changCallback();
    });
  }
  async createCollection(collection: schema.XColl): Promise<void> {
    if (!/^[_a-z-0-9]{5,30}$/.test(collection.code)) {
      throw new Error("集合代码必须是长度为5~30个字符的小写英文字母、数字或('-','_')!");
    }
    if (this.collections.find((item) => item.code == collection.code)) {
      throw new Error('集合代码已存在!');
    }
    this.collections.push(collection);
    if (await this.cache.set('collections', this.collections)) {
      await this.cache.notity('collections', this.collections);
    }
  }
}
