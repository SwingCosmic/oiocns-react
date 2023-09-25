import { PageElement } from "@/components/PageBuilder/core/PageElement";
import type ElementFactory from "./ElementFactory";


export type ElementInit<E extends PageElement> = Partial<Pick<E, "className" | "style" | "props" | "data">>;

export interface PageElementView extends PageElement {
  parentId?: string;
}

/**
 * 元素树管理器，用于维护一颗元素树的状态，提供了增删改的方法
 */
export default class ElementTreeManager {

  readonly root: PageElementView;
  readonly allElements: Dictionary<PageElementView> = {};

  readonly factory!: ElementFactory;

  constructor(factory: ElementFactory, root?: PageElement) {
    this.factory = factory;

    if (!root) {
      root = {
        id: "$root",
        kind: "root",
        name: "模板根节点",
        children: [],
        props: {}
      };
    }
    this.root = root;
  }
  

  createElement<E extends PageElement>(kind: E["kind"], name: string, parentId?: string, params: ElementInit<E> = {}): PageElementView {
    const e: PageElementView = this.factory.create(kind, name, params);
    e.parentId = parentId;
    return e;
  }


}