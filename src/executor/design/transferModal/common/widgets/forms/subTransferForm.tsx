import SchemaForm from '@/components/SchemaForm';
import { model } from '@/ts/base';
import { ITransfer } from '@/ts/core';
import { Transfer } from '@/ts/core/thing/standard/transfer';
import { ProFormColumnsType, ProFormInstance } from '@ant-design/pro-components';
import { Input } from 'antd';
import React, { useEffect, useRef } from 'react';
import {
  NameColumn,
  CodeColumn,
  PreScriptColumn,
  PostScriptColumn,
  RemarkColumn,
} from './common';

interface IProps {
  transfer: ITransfer;
  current: model.SubTransfer;
  finished: () => void;
}

export const SubTransferForm: React.FC<IProps> = ({ transfer, current, finished }) => {
  const form = useRef<ProFormInstance>();
  useEffect(() => {
    const id = transfer.command.subscribe((type, cmd, args) => {
      if (type == 'data' && cmd == 'fileCollect') {
        const { prop, files } = args;
        if (files && files.length > 0) {
          const meta = files[0].metadata;
          form.current?.setFieldValue(prop, meta.id);
          transfer.transfers[meta.id] = new Transfer(meta, transfer.directory);
        }
      }
    });
    return () => {
      transfer.command.unsubscribe(id);
    };
  });
  const columns: ProFormColumnsType<model.SubTransfer>[] = [
    NameColumn,
    CodeColumn,
    {
      title: '绑定子图',
      dataIndex: 'nextId',
      colProps: { span: 24 },
      formItemProps: {
        rules: [{ required: true, message: '子图为必填项' }],
      },
      renderFormItem: (_, __, form) => {
        const item = transfer.transfers[form.getFieldValue('nextId')];
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
    <SchemaForm<model.SubTransfer>
      open
      formRef={form}
      title="子图定义"
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

export default SubTransferForm;
