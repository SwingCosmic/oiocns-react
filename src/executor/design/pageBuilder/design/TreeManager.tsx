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

const buildElementTree = (
  element: PageElement,
  ctx: DesignContext,
  parent?: PageElement,
  isSlot: boolean = false,
): any => {
  const meta = ctx.view.treeManager.factory.getMeta(element.kind);
  const slots: PageElement[] = [];
  if (meta) {
    for (const key of Object.keys(meta.props)) {
      const prop = meta.props[key];
      const slot = element.props[key];
      if (prop.type == 'type' && prop.typeName == 'slot') {
        if (slot) {
          slots.push(slot);
        } else {
          // 占位
          const ele = ctx.view.treeManager.factory.create('Any', prop.label ?? '插槽');
          ele.props.seize = true;
          slots.push(ele);
        }
      }
    }
  }
  return {
    key: element.id,
    title: element.name,
    item: element,
    isLeaf: element.children.length === 0 && slots.length == 0,
    typeName: isSlot ? '插槽' : meta?.type,
    icon: <EntityIcon entityId={element.id} size={18} />,
    parent: parent,
    children: [
      ...element.children.map((item) => buildElementTree(item, ctx, element, false)),
      ...slots.map((item) => buildElementTree(item, ctx, element, true)),
    ],
  };
};

const TreeManager: React.FC<IProps> = ({ ctx }) => {
  const [visible, setVisible] = useState<boolean>(false);
  const tree = [buildElementTree(ctx.view.rootElement, ctx)];
  return (
    <div style={{ margin: '0 8px' }}>
      <CustomTree
        treeData={tree}
        defaultExpandAll={true}
        searchable
        draggable
        onSelect={(_, info) => {
          const node = info.node as any;
          switch (node.typeName) {
            case '插槽':
              ctx.view.currentElement = node.parent;
              setVisible(true);
              break;
            default:
              ctx.view.currentElement = node.item;
              break;
          }
        }}
        selectedKeys={[ctx.view.currentElement?.id ?? '']}
        titleRender={(node: any) => {
          const meta = ctx.view.treeManager.factory.getMeta(node.item.kind);
          return (
            <div className={cls.node}>
              <Space size={0}>
                <Tag>{node.item.name}</Tag>
                <Tag>{node.item.kind}</Tag>
                <Tag>{node.typeName}</Tag>
                {node.item.props.seize && <Tag color="red">未放置</Tag>}
              </Space>
              <Space>
                {meta?.type == '容器' && (
                  <Button
                    shape="circle"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => setVisible(true)}
                  />
                )}
                {ctx.view.rootElement != node.item && !node.item.props.seize && (
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
        onDrop={(info) => {
          const target = (info.node as any).item;
          const meta = ctx.view.treeManager.factory.getMeta(target);
          if (meta?.type != '容器') {
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
        onVisibleChange={(v) => setVisible(v)}
      />
    </div>
  );
};

export default TreeManager;
