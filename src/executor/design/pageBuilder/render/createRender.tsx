import { deepClone, generateUuid } from '@/ts/base/common';
import { Result } from 'antd';
import _ from 'lodash';
import React, {
  FC,
  MouseEvent,
  createElement as h,
  useCallback,
  useContext,
  useState,
} from 'react';
import { HostMode } from '../core/IViewHost';
import { PageElement } from '../core/PageElement';
import { ElementFC } from '../elements/defineElement';
import ErrorBoundary from './ErrorBoundary';
import { DesignContext, PageContext } from './PageContext';

export type Render = FC<ElementRenderProps>;

export interface ElementRenderProps {
  readonly element: PageElement;
  readonly data?: any;
}

/**
 * 将元素的配置处理为react的属性对象
 * @param e 要处理的元素
 * @returns ReactNode所需的属性对象
 */
export function mergeProps(e: PageElement, c: ElementFC, data?: any) {
  const props = { ...e.props };

  let className = e.className;
  if (Array.isArray(className)) {
    className = className.join(' ');
  }
  props.className = className;

  let style = Object.fromEntries(
    Object.entries(e.style || {}).map((p) => {
      p[0] = _.camelCase(p[0]);
      return p;
    }),
  );
  props.style = style;
  props.id = e.id;
  props.children = e.children;

  if (c.meta) {
    const meta = c.meta;
    Object.entries(meta.props).forEach(([prop, value]) => {
      if (props[prop] == undefined && value.default != undefined) {
        props[prop] = deepClone(value.default);
      }
    });
  }
  props.data = data;
  return props;
}

export function createRender(component: ElementFC, mode: HostMode): Render {
  if (mode == 'view') {
    return createViewRender(component);
  } else {
    return createDesignRender(component);
  }
}

function createViewRender(component: ElementFC) {
  return (props: ElementRenderProps) => {
    return h(component, mergeProps(props.element, component, props.data));
  };
}

function createDesignRender(component: ElementFC) {
  const render = (props: ElementRenderProps) => {
    const ctx = useContext(PageContext) as DesignContext;
    const [key, setKey] = useState(generateUuid());
    const handleClick = useCallback((e: MouseEvent) => {
      e.stopPropagation();
      ctx.view.currentElement = props.element;
    }, []);
    ctx.view.subscribeElement(props.element.id, () => setKey(generateUuid()));
    return (
      <ErrorBoundary>
        <div
          key={key}
          className={[
            'element-wrapper',
            ctx.view.currentElement?.id == props.element.id ? 'is-current' : '',
          ].join(' ')}
          onClick={handleClick}>
          {h(component, mergeProps(props.element, component))}
        </div>
      </ErrorBoundary>
    );
  };
  return render;
}

export function createNullRender(name: string) {
  const staticRenderResult = () => (
    <div>
      <Result status="error" title={`元素 '${name}' 未注册组件`} />
    </div>
  );
  return staticRenderResult;
}