import { IBelong, XObject } from '..';
import { common, kernel, schema } from '../../base';

/**
 * 归属用户数据管理
 */
export interface IDataManager extends common.Emitter {
  /** 归属单位 */
  space: IBelong;
  /** 用户自定义集合  */
  customCollections: schema.XCollection[];
  /** 全部集合 */
  collections: schema.XCollection[];
  /** 加载内容 */
  loadContent(): Promise<void>;
  /** 添加自定义集合 */
  addCustomCollection(collection: schema.XCollection): Promise<void>;
  /** 加载所有集合 */
  loadCollections(reload?: boolean): Promise<schema.XCollection[]>;
}

export class DataManager extends common.Emitter implements IDataManager {
  constructor(belong: IBelong) {
    super();
    this.space = belong;
    this.cache = belong.cacheObj;
  }
  space: IBelong;
  cache: XObject<schema.Xbase>;
  customCollections: schema.XCollection[] = [];
  collections: schema.XCollection[] = [];
  collectionLoaded: boolean = false;
  async loadContent(): Promise<void> {
    const data = await this.cache.get<schema.XCollection[]>('collections');
    if (data) {
      this.customCollections = data;
    }
    this.cache.subscribe('collections', (res: schema.XCollection[]) => {
      this.customCollections = res;
      this.changCallback();
    });
  }
  async addCustomCollection(collection: schema.XCollection): Promise<void> {
    if (!/^[_a-z-0-9]{5,30}$/.test(collection.code)) {
      throw new Error("集合代码必须是长度为5~30个字符的小写英文字母、数字或('-','_')!");
    }
    if (this.customCollections.find((item) => item.code == collection.code)) {
      throw new Error('集合代码已存在!');
    }
    this.customCollections.push(collection);
    if (await this.cache.set('collections', this.customCollections)) {
      await this.cache.notity('collections', this.customCollections);
    }
  }
  async loadCollections(reload?: boolean | undefined): Promise<schema.XCollection[]> {
    if (!this.collectionLoaded || reload) {
      let res = await kernel.collectionList(this.space.id, [this.space.id]);
      console.log(res);
    }
    return [];
  }
}
