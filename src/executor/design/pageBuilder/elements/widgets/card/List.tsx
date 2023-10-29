import FullScreenModal from '@/components/Common/fullScreen';
import WorkForm from '@/executor/tools/workForm';
import { command, model, schema } from '@/ts/base';
import { deepClone } from '@/ts/base/common';
import { Enumerable } from '@/ts/base/common/linq';
import { XStaging } from '@/ts/base/schema';
import orgCtrl from '@/ts/controller';
import { IForm, IWork, IWorkApply } from '@/ts/core';
import { CloseCircleOutlined } from '@ant-design/icons';
import { ProList, ProListProps } from '@ant-design/pro-components';
import { Button, Input, Modal, Space, message } from 'antd';
import React, { Key, ReactNode, useEffect, useState } from 'react';
import { ExistTypeMeta } from '../../../core/ElementMeta';
import { useStagings } from '../../../core/hooks/useChange';
import { File, SEntity } from '../../../design/config/FileProp';
import { Context } from '../../../render/PageContext';
import { defineElement } from '../../defineElement';
import { DisplayType } from '../position';
import { data, label, length, valueType } from './type';

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
  props: any;
  work?: SEntity;
  form?: SEntity;
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
  let toolBarRender = props.toolBarRender;
  if (!toolBarRender) {
    toolBarRender = () => {
      const [work, setWork] = useState(props.props.work);
      const [form, setForm] = useState(props.props.form);
      return [
        <File
          accepts={['办事']}
          onOk={(files) => {
            const meta = files[0].metadata;
            props.props.work = {
              id: meta.id,
              name: meta.name,
            };
            setWork({ ...props.props.work });
          }}>
          <Button
            icon={
              <CloseCircleOutlined
                onClick={(e) => {
                  e.stopPropagation();
                  props.props.work = undefined;
                  setWork(undefined);
                }}
              />
            }>
            {work ? work.name : '绑定办事'}
          </Button>
        </File>,
        <File
          accepts={['事项配置', '实体配置']}
          onOk={(files) => {
            const meta = files[0].metadata;
            props.props.form = {
              id: meta.id,
              name: meta.name,
            };
            setForm({ ...props.props.form });
          }}>
          <Button
            icon={
              <CloseCircleOutlined
                onClick={(e) => {
                  e.stopPropagation();
                  props.props.form = undefined;
                  setForm(undefined);
                }}
              />
            }>
            {form ? form.name : '绑定表单'}
          </Button>
        </File>,
      ];
    };
  }
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
        toolBarRender={toolBarRender}
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
  const [center, setCenter] = useState(<></>);
  const openWorkForm = (apply: IWorkApply) => {
    const info: { content: string } = { content: '' };
    const formData = new Map<string, model.FormEditData>();
    setCenter(
      <FullScreenModal
        open
        centered
        fullScreen
        destroyOnClose
        onCancel={() => setCenter(<></>)}>
        <WorkForm
          allowEdit
          belong={apply.belong}
          data={apply.instanceData}
          nodeId={apply.instanceData.node.id}
          onChanged={(id, data) => {
            formData.set(id, data);
          }}
        />
        <div
          style={{
            padding: 10,
            display: 'flex',
            alignItems: 'flex-end',
          }}>
          <Input.TextArea
            style={{
              height: 100,
              width: 'calc(100% - 80px)',
              marginRight: 10,
            }}
            placeholder="请填写备注信息"
            onChange={(e) => {
              info.content = e.target.value;
            }}
          />
          <Button
            type="primary"
            onClick={async () => {
              const data = await apply.ruleService.handleSubmit(formData);
              if (data.success) {
                apply.createApply(apply.belong.id, info.content, data.values).then(() => {
                  message.success('发起成功！');
                  const filter = stagings.filter((item) => keys.includes(item.id));
                  orgCtrl.box.removeStaging(filter).then(() => {
                    setKeys([]);
                  });
                });
                setCenter(<></>);
              } else {
                message.warning('表单提交规则验证失败，请检查');
              }
            }}>
            提交
          </Button>
        </div>
      </FullScreenModal>,
    );
  };
  return (
    <>
      <Design
        {...props}
        data={stagings}
        rowKey={'id'}
        toolBarRender={() => {
          const [loading, setLoading] = useState(false);
          return [
            <Button
              loading={loading}
              onClick={async () => {
                try {
                  setLoading(true);
                  let finalWork: IWork | undefined = undefined;
                  let finalForm: IForm | undefined = undefined;
                  const work = props.work;
                  const form = props.form;
                  if (work && form) {
                    outer: for (const app of await orgCtrl.loadApplications()) {
                      const works = await app.loadWorks();
                      for (const w of works) {
                        if (w.id == work.id) {
                          finalWork = w;
                          await w.loadWorkNode();
                          let filter = w.detailForms.filter((i) => i.id == form.id);
                          finalForm = filter.length > 0 ? filter[0] : undefined;
                          break outer;
                        }
                      }
                    }
                  }
                  if (finalWork && finalForm) {
                    const selected = stagings
                      .filter((item) => keys.includes(item.id))
                      .map((item) => {
                        const data = deepClone(item.data);
                        for (const field of finalForm!.fields) {
                          data[field.id] = data[field.code];
                          delete data[field.code];
                        }
                        return data;
                      });
                    if (selected.length == 0) {
                      message.error('选中至少一条发起申领！');
                      return;
                    }
                    const instance = {
                      data: {
                        [finalForm.id]: [
                          {
                            before: [],
                            after: selected,
                          },
                        ],
                      },
                    } as any as model.InstanceDataModel;
                    const apply = await finalWork.createApply(undefined, instance);
                    if (apply) {
                      openWorkForm(apply);
                    }
                  } else {
                    message.error('未绑定办事和表单，无法发起！');
                  }
                } finally {
                  setLoading(false);
                }
              }}>
              发起申领
            </Button>,
          ];
        }}
        headerTitle={
          <Space>
            <Button onClick={() => setKeys(stagings.map((item) => item.id))}>全选</Button>
            <Button onClick={() => setKeys([])}>取消</Button>
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
      {center}
    </>
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
    props: {
      work: {
        type: 'type',
        label: '绑定办事',
        typeName: 'workFile',
      } as ExistTypeMeta<SEntity | undefined>,
      form: {
        type: 'type',
        label: '绑定表单',
        typeName: 'formFile',
      } as ExistTypeMeta<SEntity | undefined>,
    },
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
