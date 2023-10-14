import React, { useState } from 'react';
import { defineElement } from './defineElement';
import { EnumTypeMeta } from '../core/ElementMeta';

export default defineElement({
  render(props, ctx) {
    const isDesign = ctx.view.mode == 'design';
    const [layoutType, setLayoutType] = useState(props.layoutType);
    ctx.view.subscribeElement(props.id, () => {
      const layout = ctx.view.treeManager.allElements[props.id].props.layoutType;
      setLayoutType(layout);
    });
    return (
      <div
        style={{ height: '100%' }}
        className={['element-root', isDesign ? 'is-design' : '', `is-${layoutType}`].join(
          ' ',
        )}>
        {isDesign ? (
          <div className="design-tip">
            <div>设计模式</div>
          </div>
        ) : (
          <></>
        )}
        {props.children.map((c) => {
          // 自递归渲染
          const Render = ctx.view.components.getComponentRender(c.kind, ctx.view.mode);
          return <Render key={c.id} element={c} />;
        })}
      </div>
    );
  },
  displayName: 'Root',
  meta: {
    props: {
      layoutType: {
        type: 'enum',
        label: '布局方式',
        options: [
          { label: '滚动', value: 'scroll' },
          { label: '撑满', value: 'full' },
        ],
        default: 'scroll',
      } as EnumTypeMeta<'scroll' | 'full'>,
    },
    type: '布局',
    label: '模板根元素',
  },
});
