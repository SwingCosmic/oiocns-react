import { Layout, Menu, message } from 'antd';
import React, { ReactNode, useState } from 'react';
import { DesignContext, PageContext } from '../render/PageContext';
import Coder from './context';

import { AiOutlineApartment } from '@/icons/ai';
import {
  CheckOutlined,
  FileOutlined,
  RightCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useComputed } from '@preact/signals-react';
import TreeManager from './TreeManager';
import ElementProps from './config/ElementProps';
import css from './designer.module.less';
import { ViewerHost } from '../view/ViewerHost';
import ViewerManager from '../view/ViewerManager';

export interface DesignerProps {
  ctx: DesignContext;
}

export function DesignerHost({ ctx }: DesignerProps) {
  const currentElement = useComputed(() => ctx.view.currentElement);
  const [active, setActive] = useState<string>();
  const [status, setStatus] = useState(false);
  ctx.view.subscribe(() => setStatus(!status));

  console.log('re-render');

  function renderTabs() {
    return [
      {
        key: 'tree',
        label: '元素树',
        icon: <AiOutlineApartment />,
      },
      {
        key: 'element',
        label: '元素配置',
        icon: <SettingOutlined />,
      },
      {
        key: 'data',
        label: 'JSON 数据',
        icon: <FileOutlined />,
      },
      {
        key: 'preview',
        label: '预览',
        icon: <RightCircleOutlined />,
      },
      {
        key: 'save',
        label: '保存',
        icon: <CheckOutlined />,
      },
    ];
  }

  const Configuration: { [key: string]: ReactNode } = {
    tree: <TreeManager ctx={ctx} />,
    element: <ElementProps element={currentElement.value} />,
    data: <Coder />,
  };

  const RootRender = ctx.view.components.rootRender as any;
  return (
    <PageContext.Provider value={ctx}>
      <div className={css.content}>
        <Layout.Sider collapsedWidth={60} collapsed={true}>
          <Menu
            items={renderTabs()}
            mode={'inline'}
            selectedKeys={active ? [active] : []}
            onSelect={(info) => {
              if (info.key == 'save') {
                ctx.view.update().then(() => message.success('保存成功！'));
                return;
              }
              setActive(info.key);
            }}
            onDeselect={() => setActive(undefined)}
          />
        </Layout.Sider>
        <div
          className={`${
            active && active != 'preview' ? css.designConfig : ''
          } is-full-height`}>
          {active ? Configuration[active] : <></>}
        </div>
        {active != 'preview' && (
          <div className="o-page-host" style={{ flex: 'auto' }}>
            <RootRender element={ctx.view.rootElement} />
          </div>
        )}
        {active == 'preview' && (
          <ViewerHost ctx={{ view: new ViewerManager(ctx.view.pageInfo) }} />
        )}
      </div>
    </PageContext.Provider>
  );
}
