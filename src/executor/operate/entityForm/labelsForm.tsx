import React, { useEffect, useState } from 'react';
import { ProFormColumnsType } from '@ant-design/pro-components';
import SchemaForm from '@/components/SchemaForm';
import { IBelong, IDirectory, IForm } from '@/ts/core';
import UploadItem from '../../tools/uploadItem';
import { EntityColumns } from './entityColumns';
import { schema } from '@/ts/base';
import { Button, Form, Input, Modal, Select, Space, message } from 'antd';

interface Iprops {
  formType: string;
  typeName: string;
  current: IDirectory | IForm;
  finished: () => void;
}

const CollectionForm: React.FC<{ space: IBelong; finished: () => void }> = (props) => {
  const [form] = Form.useForm();
  return (
    <Modal
      open
      title={'创建集合'}
      onOk={async () => {
        await form.validateFields();
        const value = await form.validateFields();
        try {
          const code = 'formdata-' + value.code;
          await props.space.dataManager.addCustomCollection({ ...value, code });
          props.finished();
        } catch (error) {
          message.error((error as Error).message);
        }
      }}
      onCancel={props.finished}>
      <Form form={form} preserve>
        <Form.Item
          label="集合代码（前缀 formdata-）"
          name="code"
          rules={[{ required: true, message: '集合代码为必填项!' }]}>
          <Input />
        </Form.Item>
        <Form.Item
          label="集合名称"
          name="name"
          rules={[{ required: true, message: '集合名称为必填项!' }]}>
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
};

/*
  编辑
*/
const LabelsForm = (props: Iprops) => {
  let space: IBelong;
  if (props.formType == 'new') {
    space = (props.current as IDirectory).target.space;
  } else {
    space = (props.current as IForm).directory.target.space;
  }
  const [collections, setCollections] = useState(space.dataManager.collections);
  const [collectionForm, setCollectionForm] = useState(<></>);
  useEffect(() => {
    const id = space.dataManager.subscribe(() => {
      setCollections(space.dataManager.customCollections);
    });
    return () => {
      space.dataManager.unsubscribe(id);
    };
  }, []);
  let title = '';
  let directory: IDirectory;
  let form: IForm | undefined;
  const readonly = props.formType === 'remark';
  let initialValue: any = props.current.metadata;
  switch (props.formType) {
    case 'new':
      title = '新建' + props.typeName;
      initialValue = {};
      directory = props.current as IDirectory;
      break;
    case 'update':
      form = props.current as IForm;
      directory = form.directory;
      title = '更新' + props.typeName;
      break;
    case 'remark':
      form = props.current as IForm;
      directory = form.directory;
      title = '查看' + props.typeName;
      break;
    default:
      return <></>;
  }
  const columns: ProFormColumnsType<schema.XForm>[] = [
    {
      title: '图标',
      dataIndex: 'icon',
      colProps: { span: 24 },
      renderFormItem: (_, __, form) => {
        return (
          <UploadItem
            readonly={readonly}
            typeName={props.typeName}
            icon={initialValue.icon}
            onChanged={(icon) => {
              form.setFieldValue('icon', icon);
            }}
            directory={directory}
          />
        );
      },
    },
    {
      title: '名称',
      dataIndex: 'name',
      readonly: readonly,
      formItemProps: {
        rules: [{ required: true, message: '分类名称为必填项' }],
      },
    },
    {
      title: '代码',
      dataIndex: 'code',
      readonly: readonly,
      formItemProps: {
        rules: [{ required: true, message: '分类代码为必填项' }],
      },
    },
    {
      title: '类型',
      dataIndex: 'typeName',
      valueType: 'select',
      initialValue: '表单',
      readonly: readonly,
      fieldProps: {
        options: ['表单', '报表'].map((i) => {
          return {
            value: i,
            label: i,
          };
        }),
      },
      formItemProps: {
        rules: [{ required: true, message: '类型为必填项' }],
      },
    },
    {
      title: '存储位置',
      dataIndex: 'collName',
      valueType: 'select',
      renderFormItem: (_, __, form) => {
        return (
          <Select
            value={form.getFieldValue('collName')}
            dropdownRender={(menu) => {
              return (
                <Space style={{ width: '100%', padding: 4 }} direction="vertical">
                  {menu}
                  <Button
                    block
                    onClick={() => {
                      setCollectionForm(
                        <CollectionForm
                          space={space}
                          finished={() => setCollectionForm(<></>)}
                        />,
                      );
                    }}>
                    创建数据集
                  </Button>
                </Space>
              );
            }}
            options={collections.map((i) => {
              return {
                label: `${i.name}[${i.code}]`,
                value: i.code,
              };
            })}
          />
        );
      },
    },
  ];
  if (readonly) {
    columns.push(...EntityColumns(props.current!.metadata));
  }
  columns.push({
    title: '备注信息',
    dataIndex: 'remark',
    valueType: 'textarea',
    colProps: { span: 24 },
    readonly: readonly,
    formItemProps: {
      rules: [{ required: true, message: '备注信息为必填项' }],
    },
  });
  return (
    <>
      <SchemaForm<schema.XForm>
        open
        title={title}
        width={640}
        columns={columns}
        initialValues={initialValue}
        rowProps={{
          gutter: [24, 0],
        }}
        layoutType="ModalForm"
        onOpenChange={(open: boolean) => {
          if (!open) {
            props.finished();
          }
        }}
        onFinish={async (values) => {
          switch (props.formType) {
            case 'update':
              await form!.update(values);
              break;
            case 'new':
              await directory.standard.createForm(values);
              break;
          }
          props.finished();
        }}></SchemaForm>
      {collectionForm}
    </>
  );
};

export default LabelsForm;
