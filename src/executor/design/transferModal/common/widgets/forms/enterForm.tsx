import SchemaForm from '@/components/SchemaForm';
import { model } from '@/ts/base';
import { ITransfer } from '@/ts/core';
import { ProFormColumnsType, ProFormInstance } from '@ant-design/pro-components';
import { Input } from 'antd';
import React, { useEffect, useRef } from 'react';
import {
  CodeColumn,
  NameColumn,
  PostScriptColumn,
  PreScriptColumn,
  RemarkColumn,
} from './common';
import { Form } from '@/ts/core/thing/standard/form';

interface IProps {
  transfer: ITransfer;
  current: model.Form;
  finished: () => void;
}

export const EnterForm: React.FC<IProps> = ({ transfer, current, finished }) => {
  const form = useRef<ProFormInstance>();
  useEffect(() => {
    const id = transfer.command.subscribe((type, cmd, args) => {
      if (type == 'data' && cmd == 'fileCollect') {
        const { prop, files } = args;
        if (files && files.length > 0) {
          const item = files[0].metadata;
          form.current?.setFieldValue(prop, '_' + item.id);
          transfer.forms['_' + item.id] = new Form(item, transfer.directory);
        }
      }
    });
    return () => {
      transfer.command.unsubscribe(id);
    };
  });
  const columns: ProFormColumnsType<model.Form>[] = [
    NameColumn,
    CodeColumn,
    {
      title: '表单',
      dataIndex: 'form',
      formItemProps: {
        rules: [{ required: true, message: '表单为必填项' }],
      },
      colProps: { span: 24 },
      renderFormItem: (_, __, form) => {
        const item = transfer.forms[form.getFieldValue('form')];
        return (
          <Input
            value={item?.name}
            onClick={() => {
              transfer.command.emitter('data', 'file', {
                prop: 'form',
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
    <SchemaForm<model.Form>
      open
      formRef={form}
      title="表单定义"
      width={800}
      columns={columns}
      rowProps={{
        gutter: [24, 0],
      }}
      layoutType="ModalForm"
      initialValues={current}
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
