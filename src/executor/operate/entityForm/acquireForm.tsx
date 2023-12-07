import OpenFileDialog from '@/components/OpenFileDialog';
import SchemaForm from '@/components/SchemaForm';
import { schema } from '@/ts/base';
import { IApplication } from '@/ts/core';
import { IAcquire } from '@/ts/core/work/acquire';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { ProFormColumnsType } from '@ant-design/pro-components';
import { Space, Tag } from 'antd';
import React, { useState } from 'react';
import UploadItem from '../../tools/uploadItem';

interface IProps {
  formType: string;
  current: IAcquire | IApplication;
  finished: () => void;
}

/*
  业务标准编辑模态框
*/
const AcquireForm = ({ finished, formType, current }: IProps) => {
  const [center, setCenter] = useState(<></>);
  let title = '';
  const readonly = formType === 'remarkDir';
  let initialValue: any = current.metadata;
  switch (formType) {
    case 'newAcquire':
      title = '新建数据领用';
      initialValue = { shareId: current.directory.target.id };
      break;
    case 'updateAcquire':
      title = '更新数据领用';
      break;
    case 'remarkAcquire':
      title = '查看数据领用';
      break;
    default:
      return <></>;
  }
  const columns: ProFormColumnsType<schema.XAcquire>[] = [
    {
      title: '图标',
      dataIndex: 'icon',
      colProps: { span: 24 },
      renderFormItem: (_, __, form) => {
        return (
          <UploadItem
            typeName={'数据领用'}
            readonly={readonly}
            icon={current?.metadata?.icon || ''}
            onChanged={(icon) => {
              form.setFieldValue('icon', icon);
            }}
            directory={current.directory}
          />
        );
      },
    },
    {
      title: '领用名称',
      readonly: readonly,
      dataIndex: 'name',
      formItemProps: {
        rules: [{ required: true, message: '事项名称为必填项' }],
      },
    },
    {
      title: '领用编号',
      readonly: readonly,
      dataIndex: 'code',
      formItemProps: {
        rules: [{ required: true, message: '事项编号为必填项' }],
      },
    },
    {
      title: '领用数据表单',
      readonly: readonly,
      dataIndex: 'forms',
      colProps: { span: 24 },
      formItemProps: {
        rules: [{ required: true, message: '领用表单为必填项' }],
      },
      renderFormItem: (_, __, form) => {
        const forms = form.getFieldValue('forms');
        return (
          <Space wrap style={{ maxHeight: 160, overflowY: 'scroll' }}>
            {forms?.map((item: { id: string; name: string }, index: number) => {
              return (
                <Tag key={index}>
                  <Space>
                    {item.name}
                    {
                      <CloseOutlined
                        onClick={() => {
                          const filter = forms.filter((form: any) => form.id !== item.id);
                          form.setFieldValue('forms', filter);
                        }}
                      />
                    }
                  </Space>
                </Tag>
              );
            })}
            <Tag
              onClick={() => {
                setCenter(
                  <OpenFileDialog
                    accepts={['表单']}
                    multiple
                    rootKey={current.directory.target.directory.key}
                    excludeIds={forms?.map((item: any) => item.id)}
                    onOk={(files) => {
                      const items = files.map((item) => {
                        return { id: item.id, name: item.name };
                      });
                      form.setFieldValue('forms', items);
                      setCenter(<></>);
                    }}
                    onCancel={() => setCenter(<></>)}
                  />,
                );
              }}>
              <PlusOutlined />
            </Tag>
          </Space>
        );
      },
    },
    {
      title: '备注',
      readonly: readonly,
      dataIndex: 'remark',
      valueType: 'textarea',
      colProps: { span: 24 },
      formItemProps: {
        rules: [{ required: true, message: '分类定义为必填项' }],
      },
    },
  ];
  return (
    <>
      <SchemaForm<schema.XAcquire>
        open
        key={'acquireForm'}
        width={640}
        layoutType="ModalForm"
        initialValues={initialValue}
        title={title}
        onOpenChange={(open: boolean) => {
          if (!open) {
            finished();
          }
        }}
        rowProps={{
          gutter: [24, 0],
        }}
        onFinish={async (values: any) => {
          switch (formType) {
            case 'updateAcquire':
              await (current as IAcquire).update({ ...current.metadata, ...values });
              break;
            case 'newAcquire':
              await (current as IApplication).createAcquire(values);
              break;
          }
          finished();
        }}
        columns={columns}
      />
      {center}
    </>
  );
};

export default AcquireForm;
