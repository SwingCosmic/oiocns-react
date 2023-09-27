import { useSimpleSignal } from '@/hooks/useSignal';
import { IPageTemplate } from '@/ts/core/thing/standard/page';
import { Button, message } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { IPageContext } from '../render/PageContext';
import HostManagerBase from '../render/ViewManager';
import { PageContext } from '../render/PageContext';
import Coder from './context';

import css from './designer.module.less';

export interface DesignerProps {
  current: IPageTemplate;
}

export function DesignerHost({ current }: DesignerProps) {
  const ctx = useSimpleSignal<IPageContext<'design'>>({
    view: new HostManagerBase('design', current),
  });

  const RootRender = ctx.current.view.components.rootRender as any;
  const [meta, setMeta] = useState(current.metadata);
  const content = useRef<string>(
    JSON.stringify(current.metadata.rootElement.children, null, 2),
  );
  useEffect(() => {
    const id = current.subscribe(() => {
      setMeta(current.metadata);
    });
    return () => {
      current.unsubscribe(id);
    };
  });
  return (
    <div className={css.pageHostDesign}>
      <div className={css.top}>
        <Button
          onClick={() => {
            try {
              current.metadata.rootElement.children = JSON.parse(content.current);
              current.update(current.metadata);
            } catch (error) {
              message.error('JSON 格式错误！');
            }
          }}>
          确认
        </Button>
      </div>
      <div className={css.content}>
        <Coder current={content.current} onChange={(data) => (content.current = data)} />
        <PageContext.Provider value={ctx.current}>
          <div className="o-page-host">
            <RootRender element={meta.rootElement}></RootRender>
          </div>
        </PageContext.Provider>
      </div>
    </div>
  );
}
