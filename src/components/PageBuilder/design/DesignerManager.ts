import { PageElement } from "../core/PageElement";
import HostManagerBase from "../render/ViewManager";

export default class DesignerManager extends HostManagerBase<"design"> {
 
  
  /** 获取或设置根元素的子元素 */
  get rootChildren(): readonly PageElement[] {
    return this.treeManager.root.children;
  }
  set rootChildren(v: PageElement[]) {
    this.treeManager.root.children = v;
    this.treeManager.changeParent(v, this.treeManager.root.id);
  }

}