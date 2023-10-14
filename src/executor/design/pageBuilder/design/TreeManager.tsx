import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import CustomTree from '@/components/CustomTree';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Space, Tag, message } from 'antd';
import React, { useRef, useState } from 'react';
import { PageElement } from '../core/PageElement';
import { DesignContext } from '../render/PageContext';
import AddElementModal from './AddElementModal';
import { removeElement, removeSlot } from './config/ElementProps';
import cls from './tree.module.less';

interface IProps {
  ctx: DesignContext;
}

const buildElementTree = (
  element: PageElement,
  ctx: DesignContext,
  parent?: PageElement,
  isSlot: boolean = false,
  prop?: string,
): any => {
  const meta = ctx.view.treeManager.factory.getMeta(element.kind);
  const slots: { ele: PageElement; prop: string }[] = [];
  if (meta) {
    for (const key of Object.keys(meta.props)) {
      const prop = meta.props[key];
      let ele = element.slots?.[key];
      if (prop.type == 'type' && prop.typeName == 'slot') {
        if (!ele) {
          ele = ctx.view.treeManager.factory.create('Any', prop.label ?? '插槽');
          ele.props.seize = true;
        }
        slots.push({ ele, prop: key });
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
    prop: prop,
    children: [
      ...element.children.map((item) => buildElementTree(item, ctx, element, false)),
      ...slots.map((item) => buildElementTree(item.ele, ctx, element, true, item.prop)),
    ],
  };
};

const TreeManager: React.FC<IProps> = ({ ctx }) => {
  const [visible, setVisible] = useState<boolean>(false);
  const tree = [buildElementTree(ctx.view.rootElement, ctx)];
  const prop = useRef();
  return (
    <div style={{ margin: '0 8px' }}>
      <CustomTree
        treeData={tree}
        defaultExpandAll={true}
        searchable
        draggable
        onSelect={(_, info) => {
          const node = info.node as any;
          if (node.typeName == '插槽' && node.item.props.seize) {
            ctx.view.currentElement = node.parent;
            setVisible(true);
            prop.current = node.prop;
            return;
          }
          ctx.view.currentElement = node.item;
          prop.current = undefined;
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
                    onClick={(e) => {
                      e.stopPropagation();
                      if (node.prop) {
                        removeSlot(node.parent, ctx, node.prop);
                      } else {
                        removeElement(node.item, ctx);
                      }
                    }}
                  />
                )}
              </Space>
            </div>
          );
        }}
        onDrop={(info) => {
          const dragNode = info.dragNode as any;
          const drag = dragNode.item;
          const target = (info.node as any).item;
          const meta = ctx.view.treeManager.factory.getMeta(target.kind);
          if (dragNode.typeName == '插槽') {
            message.error('插槽节点不能拖拽！');
            return;
          }
          if (meta?.type != '容器') {
            message.error('非布局节点，无法放置！');
            return;
          }
          const positions = info.node.pos.split('-');
          ctx.view.moveElement(drag, target, Number(positions[positions.length - 1]));
        }}
      />
      <AddElementModal
        visible={visible}
        parentId={ctx.view.currentElement?.id!}
        onVisibleChange={(v) => setVisible(v)}
        prop={prop.current}
      />
    </div>
  );
};

export default TreeManager;
