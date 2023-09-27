import { PageTemplate } from "@/ts/base/pageModel";
import ElementFactory from "../core/ElementFactory";
import ElementTreeManager from "../core/ElementTreeManager";
import ReactComponentFactory from "./ReactComponentFactory";
import { HostMode, IViewHost } from "../core/IViewHost";
import staticContext from "..";
import { PageElement } from "../core/PageElement";
import { IPageTemplate } from "@/ts/core/thing/standard/page";

export default class HostManagerBase<T extends HostMode> implements IViewHost<T, ReactComponentFactory> {
  readonly mode: T;
  treeManager: ElementTreeManager;
  components: ReactComponentFactory;
  elements: ElementFactory;

  readonly pageInfo: IPageTemplate;

  constructor(mode: T, pageFile: IPageTemplate) {
    this.mode = mode;
    this.pageInfo = pageFile;

    this.components = staticContext.components;
    this.elements = staticContext.elements;

    this.treeManager = new ElementTreeManager(staticContext.elements, pageFile.metadata.rootElement);
  }

  get page(): PageTemplate {
    return this.pageInfo.metadata;
  }
  

  /** 获取根元素 */
  get rootElement(): Readonly<PageElement> {
    return this.treeManager.root;
  }

}