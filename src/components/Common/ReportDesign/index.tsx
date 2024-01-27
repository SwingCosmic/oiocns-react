import { IForm } from '@/ts/core';
import React, { useState } from 'react';
import Config from './config';
import { Resizable } from 'devextreme-react';
import { Layout } from 'antd';
import ReportRender from './report';
import { Emitter } from '@/ts/base/common';
import useCtrlUpdate from '@/hooks/useCtrlUpdate';

interface IFormDesignProps {
  current: IForm;
}

/** 办事报表设计器 */
const WorkFormDesign: React.FC<IFormDesignProps> = ({ current }) => {
  const [key] = useCtrlUpdate(current);
  const [selectIndex, setSelectIndex] = React.useState<number>(-1);
  const [mainWidth, setMainWidth] = React.useState<number>(400);
  const [notifyEmitter] = useState(new Emitter());
  return (
    <Layout key={key}>
      <Layout.Content>
        {React.useMemo(
          () => (
            <ReportRender
              current={current}
              onItemSelected={setSelectIndex}
              notityEmitter={notifyEmitter}
            />
          ),
          [current],
        )}
      </Layout.Content>
      <Resizable
        handles={'right'}
        width={mainWidth}
        maxWidth={800}
        minWidth={400}
        onResize={(e) => setMainWidth(e.width)}>
        <Layout.Sider width={'100%'} style={{ height: '100%' }}>
          {React.useMemo(
            () => (
              <Config
                current={current}
                index={selectIndex}
                notifyEmitter={notifyEmitter}
              />
            ),
            [current, selectIndex],
          )}
        </Layout.Sider>
      </Resizable>
    </Layout>
  );
};

export default WorkFormDesign;
