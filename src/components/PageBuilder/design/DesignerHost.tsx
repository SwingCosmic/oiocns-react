import { useSimpleSignal } from '@/hooks/useSignal';
import { IPageTemplate } from '@/ts/core/thing/standard/page';
import { Button, message, Tabs } from 'antd';
import React, { Component, useRef, useState } from 'react';
import { DesignContext, PageContext } from '../render/PageContext';
import Coder from './context';

import css from './designer.module.less';
import DesignerManager from './DesignerManager';
import type { Tab } from 'rc-tabs/lib/interface';
import { useChangeToken } from '@/hooks/useChangeToken';
import ElementProps from './config/ElementProps';

export interface DesignerProps {
  current: IPageTemplate;
}


export function DesignerHost({ current }: DesignerProps) {
  const ctx = useSimpleSignal<DesignContext>(() => ({ 
    view: new DesignerManager('design', current),
  }) as DesignContext);

  const RootRender = ctx.current.view.components.rootRender as any;

  const [refresh, withChangeToken] = useChangeToken();

  ctx.current.view.onNodeChange = refresh;
  
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
        children: <ElementProps element={ctx.current.view.currentElement}/>
      },
    ]
  }

console.log("re-render")
  return (
    <PageContext.Provider value={ctx.current}>
      <div className={css.pageHostDesign}>
        <div className={css.top}>
          <Button
            onClick={() => {
              // ctx.current = design;
              ctx.current.view.update();
            }}>
            保存
          </Button>
        </div>
        <div className={css.content}>
          <div className={css.designConfig} style={{ flex: 1 }}>
            <Tabs className="is-full-height" items={renderTabs()}>
            </Tabs>
          </div>
          
          <div className="o-page-host" style={{ flex: 2 }} {...withChangeToken()}>
            <RootRender element={ctx.current.view.rootElement} />
          </div>

        </div>
      </div>
    </PageContext.Provider>
  );
}
