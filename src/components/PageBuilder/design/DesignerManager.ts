import { Signal, signal } from "@preact/signals-react";
import { PageElement } from "../core/PageElement";
import HostManagerBase from "../render/HostManager";
import { IPageTemplate } from "@/ts/core/thing/standard/page";
import { IDisposable } from "@/ts/base/common";
import { ElementInit } from "../core/ElementTreeManager";

export default class DesignerManager extends HostManagerBase<"design"> implements IDisposable {

  constructor(mode: "design", pageFile: IPageTemplate) {
    super(mode, pageFile);
    this.currentElement = this.rootElement;
  }

  dispose() {
    console.info("DesignerManager disposed");
    this.onChange = null;
    this.onNodeChange = null;
    this.onCurrentChange = null;

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
    this.onNodeChange?.(this.treeManager.root);
  }

  onChange: (() => void) | null = null;
  onNodeChange: ((root: PageElement) => void) | null = null;
  onCurrentChange: ((e: PageElement | null) => void) | null = null;

  private _currentElement: Signal<PageElement | null> = signal(null);
  get currentElement() {
    return this._currentElement.value;
  }
  set currentElement(e) {
    this._currentElement.value = e;
    this.onCurrentChange?.(e);
  }

  addElement<E extends PageElement>(kind: E["kind"], name: string, parentId?: string, params: ElementInit<E> = {}): E {
    const e = this.treeManager.createElement(kind, name, parentId, params);
    this.onNodeChange?.(e);
    return e as any;
  }

}