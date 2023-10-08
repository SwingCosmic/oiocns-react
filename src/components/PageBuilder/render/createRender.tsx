import { ComponentType, FC, createElement as h, useCallback, useContext } from "react";
import { HostMode } from "../core/IViewHost";
import { PageElement } from "../core/PageElement";
import _ from "lodash";
import React, { MouseEvent } from "react";
import { Result } from "antd";
import { DesignContext, PageContext } from "./PageContext";
import { ElementMeta } from "../core/ElementMeta";
import { deepClone } from "@/ts/base/common";
import ErrorBoundary from "./ErrorBoundary";

export type Render = FC<ElementRenderProps>;


export interface ElementRenderProps {
  readonly element: PageElement;
}


/**
 * 将元素的配置处理为react的属性对象
 * @param e 要处理的元素
 * @returns ReactNode所需的属性对象
 */
export function mergeProps(e: PageElement, c: ComponentType) {
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

  if ((c as any).meta) {
    const meta = (c as any).meta as ElementMeta;
    Object.entries(meta.props).forEach(([prop, value])=>{
      if (!props[prop] && value.default) {
        props[prop] = deepClone(value.default);
      }
    });
  }

  return props;
}


export function createRender(component: ComponentType, mode: HostMode): Render {
  if (mode == "view") {
    return createViewRender(component);
  } else {
    return createDesignRender(component);
  }
}

function createViewRender(component: ComponentType) {
  return (props: ElementRenderProps) => {
    return h(component, mergeProps(props.element, component));
  };
}

function createDesignRender(component: ComponentType) {
  return (props: ElementRenderProps) => {
    const ctx = useContext(PageContext) as DesignContext;
    const handleClick = useCallback((e: MouseEvent) => {
      e.stopPropagation();
      ctx.view.currentElement = props.element;
    }, []);
    return (
      <ErrorBoundary>
        <div 
          className={[
            "element-wrapper",
            ctx.view.currentElement?.id == props.element.id ? "is-current": ""
          ].join(" ")} onClick={handleClick}>
          {h(component, mergeProps(props.element, component))}
        </div>
      </ErrorBoundary>
    );
  };
}

export function createNullRender(name: string) {
  const staticRenderResult = (
    <div>
      <Result status="error" title={`元素 ${name} 未注册组件`} />
    </div>
  );
  return () => staticRenderResult;
}