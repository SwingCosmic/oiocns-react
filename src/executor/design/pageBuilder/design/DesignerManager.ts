import { Signal, signal } from '@preact/signals-react';
import { PageElement } from '../core/PageElement';
import HostManagerBase from '../render/HostManager';
import { IPageTemplate } from '@/ts/core/thing/standard/page';
import { IDisposable } from '@/ts/base/common';
import { ElementInit } from '../core/ElementTreeManager';

export default class DesignerManager
  extends HostManagerBase<'design'>
  implements IDisposable
{
  constructor(pageFile: IPageTemplate) {
    super('design', pageFile);
    this.currentElement = this.rootElement;
  }

  dispose() {
    console.info('DesignerManager disposed');
    this.currentElement = null;
  }

  async update() {
    return await this.pageInfo.update(this.pageInfo.metadata);
  }

  /** 获取或设置根元素的子元素 */
  get rootChildren(): readonly PageElement[] {
    return this.treeManager.root.children;
  }
  set rootChildren(v: PageElement[]) {
    this.treeManager.root.children = v;
    this.treeManager.changeParent(v, this.treeManager.root.id);
    this.currentElement = null;
  }

  private _currentElement: Signal<PageElement | null> = signal(null);
  get currentElement() {
    return this._currentElement.value;
  }
  set currentElement(e) {
    this._currentElement.value = e;
  }

  addElement<E extends PageElement>(
    kind: E['kind'],
    name: string,
    slotName = 'default',
    parentId?: string,
    params: ElementInit<E> = {},
  ): E {
    const e = this.treeManager.createElement(kind, name, slotName, parentId, params);
    this.currentElement = e;
    this.emitter('all', 'change');
    return e as any;
  }

  removeElement(e: PageElement, recursive?: boolean) {
    this.treeManager.removeElement(e, recursive);
    this.currentElement = null;
  }

  changeElement(e: PageElement, targetId: string, slotName: string = 'default') {
    this.treeManager.changeParent([e], targetId, slotName);
    this.emitter('all', 'change');
  }
}
