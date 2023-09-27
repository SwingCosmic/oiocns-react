import { useSignal } from '@/hooks/useSignal';
import { IPageTemplate } from '@/ts/core/thing/standard/page';
import React from 'react';
import { IPageContext, PageContext } from '../render/PageContext';
import ViewManager from '../render/ViewManager';

export interface ViewerProps {
  current: IPageTemplate;
}

export function ViewerHost({ current }: ViewerProps) {
  const ctx = useSignal<IPageContext<'view'>>({
    view: new ViewManager('view', current.metadata),
  });

  const RootRender = ctx.current.view.components.rootRender as any;
  return (
    <PageContext.Provider value={ctx.current}>
      <div className="o-page-host page-host--view">
        <RootRender element={current.metadata.rootElement}></RootRender>
      </div>
    </PageContext.Provider>
  );
}
