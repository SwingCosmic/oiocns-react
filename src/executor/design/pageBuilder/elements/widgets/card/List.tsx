import { command, schema } from '@/ts/base';
import { XStaging } from '@/ts/base/schema';
import orgCtrl from '@/ts/controller';
import { ProList, ProListProps } from '@ant-design/pro-components';
import { Button, Modal, Space } from 'antd';
import React, { Key, ReactNode, useEffect, useState } from 'react';
import { useStagings } from '../../../core/hooks/useChange';
import { defineElement } from '../../defineElement';
import { DisplayType } from '../position';
import { data, label, length, valueType } from './type';
import { Context } from '../../../render/PageContext';
import { Enumerable } from '@/ts/base/common/linq';

interface Params {
  data: schema.XThing;
  label: string;
}

interface TypeParams extends Params {
  valueType: DisplayType;
}

interface AvatarParams extends TypeParams {
  width: number;
  height: number;
}

interface IProps
  extends Pick<
    ProListProps<schema.XStaging>,
    'rowSelection' | 'headerTitle' | 'rowKey' | 'toolBarRender'
  > {
  ctx: Context;
  data: XStaging[];
  title?: (params: Params) => ReactNode;
  avatar?: (params: AvatarParams) => ReactNode;
  description?: (params: Params) => ReactNode;
  subTitle?: (params: TypeParams) => ReactNode;
  content?: (params: Params) => ReactNode;
  action?: (entity: XStaging) => ReactNode;
}

const Design: React.FC<IProps> = (props) => {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const id = command.subscribe((type, cmd, args) => {
      if (type == 'stagings' && cmd == 'open') {
        if (props.ctx.view.mode == args) {
          setOpen(true);
        }
      }
    });
    return () => {
      command.unsubscribe(id);
    };
  }, []);
  return (
    <Modal
      open={open}
      destroyOnClose
      width={'80vw'}
      cancelButtonProps={{ hidden: true }}
      okText={'关闭'}
      onCancel={() => setOpen(false)}
      onOk={() => setOpen(false)}>
      <ProList<schema.XStaging>
        style={{ height: '70vh', overflow: 'auto' }}
        dataSource={props.data}
        toolBarRender={props.toolBarRender}
        rowKey={props.rowKey}
        headerTitle={props.headerTitle}
        rowSelection={props.rowSelection}
        metas={{
          title: {
            render: (_, entity) => {
              return props.title?.({
                data: entity.data,
                label: '标题',
              });
            },
          },
          avatar: {
            render: (_, entity) => {
              return props.avatar?.({
                data: entity.data,
                label: '图片',
                valueType: 'Avatar',
                width: 120,
                height: 120,
              });
            },
          },
          description: {
            render: (_, entity) => {
              return props.description?.({
                data: entity.data,
                label: '描述',
              });
            },
          },
          subTitle: {
            render: (_, entity) => {
              return props.subTitle?.({
                data: entity.data,
                label: '标签组',
                valueType: 'Tags',
              });
            },
          },
          actions: {
            render: (_, entity) => {
              return props.action?.(entity);
            },
          },
        }}
      />
    </Modal>
  );
};

const View: React.FC<Omit<IProps, 'data'>> = (props) => {
  const stagings = useStagings(orgCtrl.box, props.ctx.view.pageInfo.relations);
  const [keys, setKeys] = useState<Key[]>([]);
  return (
    <Design
      {...props}
      data={stagings}
      rowKey={'id'}
      toolBarRender={() => {
        return [<Button>发起申领</Button>];
      }}
      headerTitle={
        <Space>
          <Button size="small" onClick={() => setKeys(stagings.map((item) => item.id))}>
            全选
          </Button>
          <Button size="small" onClick={() => setKeys([])}>
            取消
          </Button>
        </Space>
      }
      rowSelection={{
        selectedRowKeys: keys,
        onChange: (keys: React.Key[]) => setKeys(keys),
      }}
      action={(entity) => {
        return (
          <Button
            type="dashed"
            onClick={() => {
              setKeys(keys.filter((id) => id != entity.id));
              orgCtrl.box.removeStaging([entity]);
            }}>
            删除
          </Button>
        );
      }}
    />
  );
};

export default defineElement({
  render(props, ctx) {
    if (ctx.view.mode == 'design') {
      const data = Enumerable.Range(1, 20)
        .ToArray()
        .map(() => {
          return {} as schema.XStaging;
        });
      return <Design {...props} data={data} ctx={ctx} />;
    }
    return <View {...props} ctx={ctx} />;
  },
  displayName: 'ListItem',
  meta: {
    props: {},
    slots: {
      title: {
        label: '标题',
        single: true,
        params: { data, label },
        default: 'Field',
      },
      avatar: {
        label: '头像',
        single: true,
        params: { data, label, valueType, width: length, height: length },
        default: 'Field',
      },
      description: {
        label: '描述',
        single: true,
        params: { data, label },
        default: 'Field',
      },
      subTitle: {
        label: '标签',
        single: true,
        params: { data, label, valueType },
        default: 'Field',
      },
      content: {
        label: '内容',
        single: true,
        params: { data, label },
        default: 'Field',
      },
    },
    label: '列表卡片',
    type: 'Element',
  },
});
