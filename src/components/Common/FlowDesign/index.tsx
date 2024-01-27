import React, { useState } from 'react';
import { IWork } from '@/ts/core';
import { NodeModel } from './processType';
import ProcessTree from './ProcessTree';
import { Resizable } from 'devextreme-react';
import { Layout } from 'antd';
import useCtrlUpdate from '@/hooks/useCtrlUpdate';
import Config from './Config';

interface IProps {
  current: IWork;
  resource: NodeModel;
}

const Design: React.FC<IProps> = ({ current, resource }) => {
  const [key, Refresh] = useCtrlUpdate(current);
  const [mainWidth, setMainWidth] = React.useState<number | string>('70%');
  const [currentNode, setCurrentNode] = useState<NodeModel>(resource);

  return (
    <Layout>
      <Resizable
        handles={'right'}
        width={mainWidth}
        maxWidth={800}
        minWidth={400}
        onResize={(e) => setMainWidth(e.width)}>
        <Layout.Sider key={key} width={'100%'} style={{ height: '100%' }}>
          <ProcessTree
            target={current.directory.target}
            isEdit={true}
            resource={resource}
            onSelectedNode={(node) => {
              setCurrentNode(node);
            }}
          />
        </Layout.Sider>
      </Resizable>
      <Layout.Content>
        <Config
          key={currentNode.id}
          node={currentNode}
          define={current}
          refresh={Refresh}
        />
      </Layout.Content>
    </Layout>
  );
};

export default Design;
