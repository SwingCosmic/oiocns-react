import SchemaForm from '@/components/SchemaForm';
import { model } from '@/ts/base';
import { ITransfer } from '@/ts/core';
import { Form } from '@/ts/core/thing/standard/form';
import { ProFormColumnsType, ProFormInstance } from '@ant-design/pro-components';
import { Input } from 'antd';
import React, { createRef, useEffect } from 'react';
import {
  CodeColumn,
  NameColumn,
  PostScriptColumn,
  PreScriptColumn,
  RemarkColumn,
} from './common';

interface IProps {
  transfer: ITransfer;
  current: model.Store;
  finished: () => void;
}

export const StoreForm: React.FC<IProps> = ({ transfer, current, finished }) => {
  const form = createRef<ProFormInstance>();
  useEffect(() => {
    const id = transfer.command.subscribe((type, cmd, args) => {
      if (type == 'data' && cmd == 'fileCollect') {
        const { prop, files } = args;
        if (files && files.length > 0 && prop == 'workId') {
          const meta = files[0].metadata;
          form.current?.setFieldValue('applicationId', meta.applicationId);
          form.current?.setFieldValue('workId', meta.id);
          transfer.forms[meta.id] = new Form(meta, transfer.directory);
        }
      }
    });
    return () => {
      transfer.command.unsubscribe(id);
    };
  });
  const columns: ProFormColumnsType<model.Store>[] = [
    NameColumn,
    CodeColumn,
    {
      title: '应用（办事）',
      dataIndex: 'workId',
      colProps: { span: 24 },
      formItemProps: {
        rules: [{ required: true, message: '应用（办事）为必填项' }],
      },
      renderFormItem: (_, __, form) => {
        const item = transfer.works[form.getFieldValue('workId')];
        return (
          <Input
            value={item?.name}
            onClick={() => {
              transfer.command.emitter('data', 'file', {
                prop: 'forms',
                multiple: true,
                accepts: ['实体配置', '事项配置'],
              });
            }}
          />
        );
      },
    },
    PreScriptColumn,
    PostScriptColumn,
    RemarkColumn,
  ];
  return (
    <SchemaForm<model.Store>
      ref={form}
      open
      title="存储配置"
      width={640}
      columns={columns}
      initialValues={current}
      rowProps={{
        gutter: [24, 0],
      }}
      layoutType="ModalForm"
      onOpenChange={(open: boolean) => {
        if (!open) {
          finished();
        }
      }}
      onFinish={async (values) => {
        Object.assign(current, values);
        finished();
      }}
    />
  );
};
