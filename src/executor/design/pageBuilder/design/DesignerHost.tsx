import { Tabs, Tooltip } from 'antd';
import React, { useState } from 'react';
import { DesignContext, PageContext } from '../render/PageContext';
import Coder from './context';

import { AiOutlineApartment } from '@/icons/ai';
import { FileOutlined, SettingOutlined } from '@ant-design/icons';
import { useComputed } from '@preact/signals-react';
import type { Tab } from 'rc-tabs/lib/interface';
import ToolBar from './ToolBar';
import TreeManager from './TreeManager';
import ElementProps from './config/ElementProps';
import css from './designer.module.less';

export interface DesignerProps {
  ctx: DesignContext;
}

export function DesignerHost({ ctx }: DesignerProps) {
  const currentElement = useComputed(() => ctx.view.currentElement);
  const [status, setStatus] = useState(false);
  ctx.view.subscribe(() => setStatus(!status));

  console.log('re-render');

  function renderTabs(): Tab[] {
    return [
      {
        label: <AiOutlineApartment />,
        key: '元素树',
        children: <TreeManager ctx={ctx} />,
      },
      {
        label: <SettingOutlined />,
        key: '元素配置',
        children: <ElementProps element={currentElement.value} />,
      },
      {
        label: <FileOutlined />,
        key: 'JSON 数据',
        children: <Coder />,
      },
    ];
  }

  const RootRender = ctx.view.components.rootRender as any;
  return (
    <PageContext.Provider value={ctx}>
      <div className={css.pageHostDesign}>
        <div className={css.top}>
          <ToolBar ctx={ctx} />
        </div>
        <div className={css.content}>
          <div className={css.designConfig}>
            <Tabs
              animated
              size="large"
              renderTabBar={(props, Default) => {
                return (
                  <Default {...props}>
                    {(node) => {
                      return (
                        <Tooltip placement="right" title={node.key}>
                          {node}
                        </Tooltip>
                      );
                    }}
                  </Default>
                );
              }}
              tabBarGutter={0}
              defaultActiveKey="tree"
              items={renderTabs()}
              tabPosition="left"
            />
          </div>
          <div className="o-page-host" style={{ flex: 'auto' }}>
            <RootRender element={ctx.view.rootElement} />
          </div>
        </div>
      </div>
    </PageContext.Provider>
  );
}
