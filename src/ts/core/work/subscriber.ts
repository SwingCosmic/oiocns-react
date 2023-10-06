import { model } from '@/ts/base';
import { IPageTemplate } from '../thing/standard/page';
import { XObject } from '../public/object';
import { Emitter, generateUuid } from '@/ts/base/common';
import orgCtrl from '@/ts/controller';
import { IPerson } from '..';

export interface ISubscriber {
  // 键
  key: string;
  // 人
  user: IPerson;
  // 大对象
  object: XObject<model.SubObjects>;
  // 所有页面
  allPages: IPageTemplate[];
  // 订阅的页面
  subscribedPages: IPageTemplate[];
  // 深度加载
  deepLoad(): Promise<void>;
  // 加载页面
  loadAllPages(): Promise<IPageTemplate[]>;
  // 加载订阅页面
  loadAllSubscribedPages(): IPageTemplate[];
  // 订阅页面
  subscribePage(page: IPageTemplate): Promise<boolean>;
  // 取消订阅页面
  unsubscribePage(id: string): Promise<boolean>;
}

export class Subscriber extends Emitter implements ISubscriber {
  key: string;
  user: IPerson;
  allPages: IPageTemplate[];
  subscribedPages: IPageTemplate[];
  object: XObject<model.SubObjects>;
  method: Map<string, IPageTemplate>;
  cache: model.SubObjects | undefined;

  constructor(_user: IPerson) {
    super();
    this.key = generateUuid();
    this.user = _user;
    this.allPages = [];
    this.subscribedPages = [];
    this.method = new Map();
    this.object = new XObject(_user.metadata, 'subscribe-cache', [], [this.key]);
    this.object.subscribe(this.cachePath, (data: model.SubObjects) => {
      this.changeUnSubscribe();
      this.cache = data;
      this.changeSubscribe();
    });
    this.deepLoad().then(() => this.changeSubscribe());
  }

  get cachePath(): string {
    return `subscribes.${this.user.id}`;
  }

  async deepLoad(): Promise<void> {
    await this.object.all();
    this.cache = this.object.cache;
    await this.loadAllPages();
    this.loadAllSubscribedPages();
  }

  async loadAllPages(): Promise<IPageTemplate[]> {
    this.allPages = await orgCtrl.loadPages();
    return this.allPages;
  }

  loadAllSubscribedPages(): IPageTemplate[] {
    const pageIds = this.cache?.pageIds ?? [];
    this.subscribedPages = this.allPages.filter((item) => pageIds.indexOf(item.id) != -1);
    return this.subscribedPages;
  }

  async subscribePage(page: IPageTemplate): Promise<boolean> {
    const cache = this.cache ?? ({ pageIds: [] } as unknown as model.SubObjects);
    cache.pageIds.push(page.id);
    const res = await this.object.set(this.cachePath, cache);
    if (res) {
      await this.object.notity(this.cachePath, this.cache, true, true);
    }
    return res;
  }

  async unsubscribePage(id: string): Promise<boolean> {
    const cache = this.cache ?? ({ pageIds: [] } as unknown as model.SubObjects);
    cache.pageIds = cache.pageIds.filter((item) => item != id);
    return await this.object.set(this.cachePath, cache);
  }

  changeSubscribe() {
    this.subscribedPages.forEach((page) => {
      const id = page.subscribe(() => this.changCallback());
      this.method.set(id, page);
    });
  }

  changeUnSubscribe() {
    this.method.forEach((value, id) => value.unsubscribe(id));
  }
}
