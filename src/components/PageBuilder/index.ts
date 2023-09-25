import ElementFactory from "./core/ElementFactory";
import ComponentFactory from "./render/ReactComponentFactory";
import { FC } from "react";


export interface PageBuilderStaticContext {
  components: ComponentFactory;
  elements: ElementFactory;
}

const moduleExports: Dictionary<{default: FC<any>}> = import.meta.glob("./elements/**/*.tsx", { eager: true });

console.log(moduleExports);
debugger
const elements: Dictionary<FC<any>> = {};
let root: FC<any> | null = null;
for (const [path, _exports] of Object.entries(moduleExports)) {
  let name = _exports.default.displayName;
  if (!name) {
    console.warn(`组件 ${path} 未定义名称，已默认赋值文件名`);
    name = /([A-Za-z0-9_])\.tsx$/.exec(path)?.[1] ?? path;
  }
  elements[name] = _exports.default;

  if (name == "Root") {
    root = _exports.default;
  }
}

if (!root) {
  throw new Error("丢失根元素渲染组件");
}


const componentFactory = new ComponentFactory(root);
componentFactory.registerComponents(elements);


const elementFactory = new ElementFactory();

export default {
  components: componentFactory,
  elements: elementFactory, 
} as PageBuilderStaticContext;
