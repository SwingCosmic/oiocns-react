import React, { useState } from 'react';
import { DesignContext } from '../render/PageContext';
import { PageElement } from '../core/PageElement';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import CustomTree from '@/components/CustomTree';
import cls from './tree.module.less';
import AddElementModal from './AddElementModal';
import { Button, Space, Tag, message } from 'antd';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { removeElement } from './config/ElementProps';

interface IProps {
  ctx: DesignContext;
}

const buildElementTree = (element: PageElement): any => {
  return {
    key: element.id,
    title: element.name,
    item: element,
    isLeaf: element.children.length === 0,
    icon: <EntityIcon entityId={element.id} size={18} />,
    children: element.children.map(item => buildElementTree(item)),
  };
};

const TreeManager: React.FC<IProps> = ({ ctx }) => {
  const [visible, setVisible] = useState<boolean>(false);
  return (
    <div style={{ margin: '0 8px' }}>
      <CustomTree
        treeData={[buildElementTree(ctx.view.rootElement)]}
        defaultExpandAll={true}
        searchable
        draggable
        onSelect={(_, info) => {
          ctx.view.currentElement = (info.node as any).item;
        }}
        selectedKeys={[ctx.view.currentElement?.id ?? '']}
        titleRender={(node: any) => {
          return (
            <div className={cls.node}>
              <Space>
                {node.item.name}
                <Tag>{node.item.kind}</Tag>
              </Space>
              <Space>
                {ctx.view.treeManager.hasChildren(node.item) && (
                  <Button
                    shape="circle"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => setVisible(true)}
                  />
                )}
                {ctx.view.rootElement != node.item && (
                  <Button
                    shape="circle"
                    size="small"
                    danger
                    icon={<MinusOutlined />}
                    onClick={() => removeElement(node.item, ctx)}
                  />
                )}
              </Space>
            </div>
          );
        }}
        onDrop={info => {
          const target = (info.node as any).item;
          if (!ctx.view.treeManager.hasChildren(target)) {
            message.error('非布局节点，其下无法放置！');
            return;
          }
          const positions = info.node.pos.split('-');
          ctx.view.moveELement(
            (info.dragNode as any).item,
            target,
            Number(positions[positions.length - 1]),
          );
        }}
      />
      <AddElementModal
        visible={visible}
        parentId={ctx.view.currentElement?.id!}
        onVisibleChange={v => setVisible(v)}
      />
    </div>
  );
};

export default TreeManager;
