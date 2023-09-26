import { PageElement } from "@/components/PageBuilder/core/PageElement";
import _ from "lodash";
import { ComponentType, FC, createElement as h, useContext } from "react";
import { IComponentFactory } from "../core/IComponentFactory";
import { PageContext } from "./PageContext";

export interface ElementRenderProps {
  readonly element: PageElement;
}

export type Render = FC<ElementRenderProps>;

/**
 * 将元素的配置处理为react的属性对象
 * @param e 要处理的元素
 * @returns ReactNode所需的属性对象
 */
export function mergeProps(e: PageElement) {
  const props = { ... e.props };
  
  let className = e.className;
  if (Array.isArray(className)) {
    className = className.join(" ");
  }
  props.className = className;

  let style = Object.fromEntries(
    Object
      .entries(e.style || {})
      .map(p => {
        p[0] = _.camelCase(p[0]);
        return p;
      })
  );
  props.style = style;

  props.children = e.children;

  return props;
}


export default class ReactComponentFactory implements IComponentFactory<ComponentType, Render> {

  get rootRender() {
    return this.getComponentRender("Root");
  }

  readonly componentDefinitions = new Map<string, ComponentType>();

  registerComponent<T extends ComponentType>(name: string, component: T) {
    this.componentDefinitions.set(name, component);
  }

  registerComponents(components: Dictionary<ComponentType>) {
    for (const [name, component] of Object.entries(components)) {
      this.registerComponent(name, component);
    }
  }


  readonly renderDefinitions = new WeakMap<ComponentType, Render>();

  /**
   * 创建或返回一个指定元素的包装渲染组件
   * @param element 元素名称
   * @returns 包装渲染组件
   */
  getComponentRender(name: string) {
    const component = this.componentDefinitions.get(name);
    if (!component) {
      throw new Error(`元素 ${name} 未注册组件`);
    }

    let def: Render | undefined = this.renderDefinitions.get(component);
    if (!def) {
      def = (props: ElementRenderProps) => {
        return h(component, mergeProps(props.element));
      };
      this.renderDefinitions.set(component, def);
    }
    return def;
  }

}