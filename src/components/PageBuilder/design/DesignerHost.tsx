import { useSimpleSignal } from '@/hooks/useSignal';
import { IPageTemplate } from '@/ts/core/thing/standard/page';
import { Button, message } from 'antd';
import React from 'react';
import { DesignContext, PageContext } from '../render/PageContext';
import Coder from './context';

import css from './designer.module.less';
import DesignerManager from './DesignerManager';

export interface DesignerProps {
  current: IPageTemplate;
}

export function DesignerHost({ current }: DesignerProps) {
  const design = { view: new DesignerManager('design', current) };
  const ctx = useSimpleSignal<DesignContext>(design);
  const RootRender = ctx.current.view.components.rootRender as any;
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
          <Coder />
          <div className="o-page-host">
            <RootRender element={ctx.current.view.rootElement}></RootRender>
          </div>
        </div>
      </div>
    </PageContext.Provider>
  );
}
