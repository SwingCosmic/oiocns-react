import { PageTemplate } from "@/ts/base/pageModel";
import ElementFactory from "../core/ElementFactory";
import ElementTreeManager from "../core/ElementTreeManager";
import ReactComponentFactory from "./ReactComponentFactory";
import { HostMode, IViewHost } from "../core/IViewHost";
import staticContext from "..";

export default class ViewManager<T extends HostMode> implements IViewHost<T, ReactComponentFactory> {
  readonly mode: T;
  treeManager: ElementTreeManager;
  components: ReactComponentFactory;
  elements: ElementFactory;

  readonly page: PageTemplate;

  constructor(mode: T, page: PageTemplate) {
    this.mode = mode;
    this.page = page;

    this.components = staticContext.components;
    this.elements = staticContext.elements;

    this.treeManager = new ElementTreeManager(staticContext.elements, page.rootElement);
  }

}