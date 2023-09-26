import { useSignal } from '@/hooks/useSignal';
import { IPageTemplate } from '@/ts/core/thing/standard/page';
import { Button } from 'antd';
import React, { useState } from 'react';
import { IPageContext } from '../render/PageContext';
import ViewManager from '../render/ViewManager';
import { PageContext } from '../render/PageContext';
import Coder from './context';

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
    <>
      <Button onClick={() => setMeta(current.metadata)}>刷新</Button>
      <Coder current={current} />
      <PageContext.Provider value={ctx.current}>
        <div className="page-host--view" style={{ height: '100%', width: '100%' }}>
          <RootRender element={meta.rootElement}></RootRender>
        </div>
      </PageContext.Provider>
    </>
  );
}
