import { Button, Tabs, message } from 'antd';
import React, { useState } from 'react';
import { DesignContext, PageContext } from '../render/PageContext';
import Coder from './context';

import { useComputed } from '@preact/signals-react';
import type { Tab } from 'rc-tabs/lib/interface';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import ElementProps from './config/ElementProps';
import css from './designer.module.less';
import TreeManager from './TreeManager';

export interface DesignerProps {
  ctx: DesignContext;
}

export function DesignerHost({ ctx }: DesignerProps) {
  const currentElement = useComputed(() => ctx.view.currentElement);
  const [status, setStatus] = useState(false);
  ctx.view.subscribe(() => setStatus(!status));

  console.log('re-render');

  function renderTabs(): Tab[] {
    return [
      {
        label: `元素树`,
        key: 'tree',
        children: <TreeManager ctx={ctx} />,
      },
      {
        label: `配置`,
        key: 'element',
        children: <ElementProps element={currentElement.value} />,
      },
      {
        label: `数据`,
        key: 'data',
        children: <div></div>,
      },
      {
        label: `JSON数据`,
        key: 'code',
        children: <Coder />,
      },
    ];
  }

  const RootRender = ctx.view.components.rootRender as any;
  return (
    <DndProvider backend={HTML5Backend}>
      <PageContext.Provider value={ctx}>
        <div className={css.pageHostDesign}>
          <div className={css.top}>
            <Button
              onClick={async () => {
                if (await ctx.view.update()) {
                  message.success('更新成功！');
                }
              }}>
              保存
            </Button>
          </div>
          <div className={css.content}>
            <div className={css.designConfig}>
              <Tabs
                className="is-full-height"
                defaultActiveKey="tree"
                items={renderTabs()}></Tabs>
            </div>

            <div className="o-page-host" style={{ flex: 'auto' }}>
              <RootRender element={ctx.view.rootElement} />
            </div>
          </div>
        </div>
      </PageContext.Provider>
    </DndProvider>
  );
}
