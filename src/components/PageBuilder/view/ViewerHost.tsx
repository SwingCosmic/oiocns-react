import { useSignal } from '@/hooks/useSignal';
import { IPageTemplate } from '@/ts/core/thing/standard/page';
import { Button } from 'antd';
import React, { useState } from 'react';
import { PageContext } from '../render/ViewContext';
import ViewManager from '../render/ViewManager';
import { ViewerPageContext } from './PageContext';
import Coder from '../design/context';

export interface ViewerProps {
  current: IPageTemplate;
}

export function ViewerHost({ current }: ViewerProps) {
  const ctx = useSignal<PageContext<'view'>>({
    view: new ViewManager('view', current.metadata),
  });

  const RootRender = ctx.current.view.components.rootRender as any;
  const [meta, setMeta] = useState(current.metadata);
  return (
    <>
      <Button onClick={() => setMeta(current.metadata)}>刷新</Button>
      <Coder current={current} />
      <ViewerPageContext.Provider value={ctx.current}>
        <div className="page-host--view" style={{ height: '100%', width: '100%' }}>
          <RootRender element={meta.rootElement}></RootRender>
        </div>
      </ViewerPageContext.Provider>
    </>
  );
}
