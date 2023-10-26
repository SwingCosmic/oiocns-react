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
import TreeManager from './TreeManager';
import ElementProps from './config/ElementProps';
import css from './designer.module.less';
import { ViewerHost } from '../view/ViewerHost';
import ViewerManager from '../view/ViewerManager';
import FullScreenModal from '@/components/Common/fullScreen';

export interface DesignerProps {
  ctx: DesignContext;
}

export function DesignerHost({ ctx }: DesignerProps) {
  const [active, setActive] = useState<string>();
  const [status, setStatus] = useState(false);
  const [open, setOpen] = useState(false);
  ctx.view.subscribe((type, cmd) => {
    if (type == 'elements' && cmd == 'change') {
      setStatus(!status);
    }
  });

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
    tree: <TreeManager />,
    element: <ElementProps />,
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
              switch (info.key) {
                case 'save':
                  ctx.view.update().then(() => message.success('保存成功！'));
                  break;
                case 'preview':
                  setOpen(true);
                  break;
                default:
                  setActive(info.key);
                  break;
              }
            }}
            onDeselect={() => setActive(undefined)}
          />
        </Layout.Sider>
        <div className={`${active ? css.designConfig : ''} is-full-height`}>
          {active ? Configuration[active] : <></>}
        </div>
        <div className="o-page-host" style={{ flex: 'auto' }}>
          <RootRender element={ctx.view.rootElement} />
        </div>
      </div>
      <FullScreenModal
        open={open}
        centered
        destroyOnClose
        width={'80vw'}
        bodyHeight={'80vh'}
        title={'页面预览'}
        onCancel={() => setOpen(false)}>
        <ViewerHost ctx={{ view: new ViewerManager(ctx.view.pageInfo) }} />
      </FullScreenModal>
    </PageContext.Provider>
  );
}
