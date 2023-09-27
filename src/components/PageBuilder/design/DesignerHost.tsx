import { useSimpleSignal } from '@/hooks/useSignal';
import { IPageTemplate } from '@/ts/core/thing/standard/page';
import { Button, message, Tabs } from 'antd';
import React, { useState } from 'react';
import { DesignContext, PageContext } from '../render/PageContext';
import Coder from './context';

import css from './designer.module.less';
import DesignerManager from './DesignerManager';
import type { Tab } from 'rc-tabs/lib/interface';

export interface DesignerProps {
  current: IPageTemplate;
}


export function DesignerHost({ current }: DesignerProps) {
  const design = { view: new DesignerManager('design', current) };
  const ctx = useSimpleSignal<DesignContext>(design);
  const RootRender = ctx.current.view.components.rootRender as any;

  const [activeKey, setActiveKey] = useState("code");

  
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
        children: <div></div>
      },
    ]
  }


  return (
    <PageContext.Provider value={ctx.current}>
      <div className={css.pageHostDesign}>
        <div className={css.top}>
          <Button
            onClick={() => {
              ctx.current.view.update();
              ctx.current = design;
            }}>
            更新数据
          </Button>
        </div>
        <div className={css.content}>
          <div className={css.designConfig} style={{ flex: 1 }}>
            <Tabs
              defaultActiveKey={activeKey}
              onChange={key => setActiveKey(key)}
              items={renderTabs()}>
            </Tabs>
          </div>
          
          <div className="o-page-host" style={{ flex: 2 }}>
            <RootRender element={ctx.current.view.rootElement} />
          </div>

        </div>
      </div>
    </PageContext.Provider>
  );
}
