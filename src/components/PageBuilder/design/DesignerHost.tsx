import { useSignal } from '@/hooks/useSignal';
import { IPageTemplate } from '@/ts/core/thing/standard/page';
import { Button } from 'antd';
import React, { useState } from 'react';
import { IPageContext } from '../render/PageContext';
import ViewManager from '../render/ViewManager';
import { PageContext } from '../render/PageContext';
import Coder from './context';

import css from "./designer.module.less";

export interface DesignerProps {
  current: IPageTemplate;
}

export function DesignerHost({ current }: DesignerProps) {
  const ctx = useSignal<IPageContext<'design'>>({
    view: new ViewManager('design', current.metadata),
  });

  const RootRender = ctx.current.view.components.rootRender as any;
  const [meta, setMeta] = useState(current.metadata);
  return (
    <div className={css.pageHostDesign}>
      <div className={css.top}>
        <Button onClick={() => setMeta(current.metadata)}>刷新</Button>
      </div>
      <div className={css.content}>
        <Coder current={current} />
        <PageContext.Provider value={ctx.current}>
          <div className="o-page-host">
            <RootRender element={meta.rootElement}></RootRender>
          </div>
        </PageContext.Provider>        
      </div>
    </div>
  );
}
