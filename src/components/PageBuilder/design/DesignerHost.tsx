import { useSignal } from '@/hooks/useSignal';
import { IPageTemplate } from '@/ts/core/thing/standard/page';
import { Button, message } from 'antd';
import React, { useRef, useState } from 'react';
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
  const contentRef = useRef<string>('[]');
  return (
    <>
      <Button
        onClick={() => {
          try {
            current.metadata.rootElement.children = JSON.parse(contentRef.current);
            current.update(current.metadata);
            setMeta(current.metadata);
          } catch (error) {
            message.error('JSON 格式错误！');
          }
        }}>
        确认
      </Button>
      <Coder current={current} onChange={(data) => (contentRef.current = data)} />
      <PageContext.Provider value={ctx.current}>
        <div className="page-host--view" style={{ height: '100%', width: '100%' }}>
          <RootRender element={meta.rootElement}></RootRender>
        </div>
      </PageContext.Provider>
    </>
  );
}
