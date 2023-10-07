import { useSimpleSignal } from '@/hooks/useSignal';
import { IPageTemplate } from '@/ts/core/thing/standard/page';
import { Button, message, Tabs } from 'antd';
import React, { Component, useEffect, useRef, useState } from 'react';
import { DesignContext, PageContext } from '../render/PageContext';
import Coder from './context';

import css from './designer.module.less';
import DesignerManager from './DesignerManager';
import type { Tab } from 'rc-tabs/lib/interface';
import { useChangeToken } from '@/hooks/useChangeToken';
import ElementProps from './config/ElementProps';
import { useComputed, useSignal } from '@preact/signals-react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

export interface DesignerProps {
  current: IPageTemplate;
}


export function DesignerHost({ current }: DesignerProps) {
  const [ready, setReady] = useState(false);

  const ctx = useSignal<DesignContext>(null!);
  const currentElement = useComputed(() => ctx.value?.view.currentElement ?? null!);
  // 只调用一次
  useEffect(() => {
    ctx.value = { 
      view: new DesignerManager('design', current),
    };
    setReady(true);
    return () => {
      ctx.value.view.dispose();
    };
  }, []);

  
  const [refresh, withChangeToken] = useChangeToken();


  console.log("re-render");

  if (!ready) {
    return <></>;
  }

  function renderTabs(): Tab[] {
    return [
      {
        label: `JSON编辑`,
        key: 'code',
        children: <Coder />
      },
      {
        label: `配置`,
        key: 'element',
        children: <ElementProps element={currentElement.value}/>
      },
    ]
  }

  const RootRender = ctx.value.view.components.rootRender as any;
  ctx.value.view.onNodeChange = refresh;
  ctx.value.view.onChange = refresh;
  return (
    <DndProvider backend={HTML5Backend}>
      <PageContext.Provider value={ctx.value}>
        <div className={css.pageHostDesign}>
          <div className={css.top}>
            <Button
              onClick={() => {
                // ctx.current = design;
                ctx.value.view.update();
              }}>
              保存
            </Button>
          </div>
          <div className={css.content}>
            <div className={css.designConfig}>
              <Tabs className="is-full-height" items={renderTabs()}>
              </Tabs>
            </div>
            
            <div className="o-page-host" style={{ flex: "auto" }} {...withChangeToken()}>
              <RootRender element={ctx.value.view.rootElement} />
            </div>

          </div>
        </div>
      </PageContext.Provider>
    </DndProvider>
  );
}
