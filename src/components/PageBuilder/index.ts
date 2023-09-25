import ElementFactory from "./core/ElementFactory";
import { ElementMeta } from "./core/ElementMeta";
import { ElementFC } from "./elements/defineElement";
import ComponentFactory from "./render/ReactComponentFactory";
import { FC } from "react";


export interface PageBuilderStaticContext {
  components: ComponentFactory;
  elements: ElementFactory;
}

function scanComponents(): PageBuilderStaticContext {
  const moduleExports: Dictionary<{ default: ElementFC }> = import.meta.glob("./elements/**/*.tsx", { eager: true });

  console.log(moduleExports);

  const elements: Dictionary<ElementFC> = {};
  const metas: Dictionary<ElementMeta> = {};
  let root: FC | null = null;
  
  for (const [path, _exports] of Object.entries(moduleExports)) {
    let name = _exports.default.displayName;
    if (!name) {
      console.warn(`组件 ${path} 未定义名称，已默认赋值文件名`);
      name = /([A-Za-z0-9_])\.tsx$/.exec(path)?.[1] ?? path;
    }
    elements[name] = _exports.default;
    metas[name] = _exports.default.meta;

    if (name == "Root") {
      root = _exports.default;
    }
  }

  if (!root) {
    throw new Error("Fatal Error: 丢失根元素渲染组件");
  }


  const componentFactory = new ComponentFactory();
  componentFactory.registerComponents(elements);


  const elementFactory = new ElementFactory(metas);

  return {
    components: componentFactory,
    elements: elementFactory, 
  };
}

export default scanComponents();
