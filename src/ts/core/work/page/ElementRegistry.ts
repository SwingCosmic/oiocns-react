import { PageElement } from "./PageElement";


export default class ElementRegistry {

  readonly root: PageElement;

  constructor(root?: PageElement) {
    if (!root) {
      root = {
        id: "$root",
        kind: "root",
        name: "模板根节点",
        children: []
      };
    }
    this.root = root;
  }


}