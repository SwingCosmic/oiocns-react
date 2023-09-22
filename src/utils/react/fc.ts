import { omit } from "lodash";
import { FC, ReactNode } from "react";


export type FCOptions<P extends {}> = Pick<FC<P>, "contextTypes" | "defaultProps" | "displayName" | "propTypes">;

export interface FCInit<P extends {}, C = any> extends FCOptions<P> {
  render: (this: never, props: P, context?: C) => ReactNode;
}

/**
 * 定义一个{@link FC} ，并启用TypeScript自动泛型推导
 * @param component 组件的定义，其中渲染函数作为`render`属性提供
 * @returns FunctionComponent
 */
export function defineFC<P extends {}, C = any>(component: Readonly<FCInit<P, C>>): FC<P> {
  const render: any = component.render;
  const options = omit(component, ["render"]);
  for (const p of Object.keys(options) as (keyof typeof options)[]) {
    render[p] = options[p];
  }
  return render;
}