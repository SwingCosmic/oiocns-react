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
  const ctx = useSimpleSignal<DesignContext>({
    view: new DesignerManager('design', current),
  });

  const RootRender = ctx.current.view.components.rootRender as any;
  return (
    <div className={css.pageHostDesign}>
      <div className={css.top}>
        <Button
          onClick={() => {
            try {
              ctx.current.view.update();
            } catch (error) {
              message.error('JSON 格式错误！');
            }
          }}>
          确认
        </Button>
      </div>
      <div className={css.content}>
        <Coder />
        <PageContext.Provider value={ctx.current}>
          <div className="o-page-host">
            <RootRender element={ctx.current.view.rootElement}></RootRender>
          </div>
        </PageContext.Provider>
      </div>
    </div>
  );
}
