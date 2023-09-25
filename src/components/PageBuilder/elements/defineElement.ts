import { FCOptions, defineFC } from '@/utils/react/fc';
import { FC, ReactNode } from 'react';
import { PageContext } from '../render/ViewContext';
import { HostMode } from '../render/ViewHost';
import { ElementMeta, ExtractMetaToType } from '../core/ElementMeta';



export interface ElementOptions<M extends ElementMeta, P extends {}> extends FCOptions<P> {
  /** 组件名称，必填 */
  displayName: string;
  /** 元素的描述元数据 */
  meta: M;
}

export interface ElementInit<M extends ElementMeta, P extends {}> extends ElementOptions<M, P> {
  render(this: undefined, props: P, context: PageContext<HostMode>): ReactNode;
}

export type ElementFC<M extends ElementMeta = ElementMeta, P extends {} = {}> = FC<P> & ElementOptions<M, P>;

export function defineElement<M extends ElementMeta, P extends {} = ExtractMetaToType<M>>(
  component: Readonly<ElementInit<M, P>>,
): ElementFC<M, P> {
  return defineFC(component as any) as any;
}
