import SchemaForm from '@/components/SchemaForm';
import { model, schema } from '@/ts/base';
import { ITransfer } from '@/ts/core';
import { AnyHandler, Excel, generateXlsx } from '@/utils/excel';
import { ProFormColumnsType, ProFormInstance } from '@ant-design/pro-components';
import { javascript } from '@codemirror/lang-javascript';
import CodeMirror from '@uiw/react-codemirror';
import { Button, Input, Space } from 'antd';
import React, { useEffect, useRef } from 'react';

interface IProps {
  transfer: ITransfer;
  current: model.Tables;
  finished: () => void;
}

const ExcelForm: React.FC<IProps> = ({ transfer, current, finished }) => {
  const form = useRef<ProFormInstance>();
  useEffect(() => {
    const id = transfer.command.subscribe((type, cmd, args) => {
      if (type == 'data' && cmd == 'fileCollect') {
        const { prop, files } = args;
        if (files && files.length > 0) {
          switch (prop) {
            case 'forms':
              form.current?.setFieldValue(
                prop,
                files.map((item: any) => item.metadata),
              );
              break;
            case 'file':
              form.current?.setFieldValue(prop, files[0].filedata);
              break;
          }
        }
      }
    });
    return () => {
      transfer.command.unsubscribe(id);
    };
  });
  const columns: ProFormColumnsType<model.Tables>[] = [
    {
      title: '名称',
      dataIndex: 'name',
      colProps: { span: 12 },
      formItemProps: {
        rules: [{ required: true, message: '名称为必填项' }],
      },
    },
    {
      title: '编码',
      dataIndex: 'code',
      colProps: { span: 12 },
      formItemProps: {
        rules: [{ required: true, message: '编码为必填项' }],
      },
    },
    {
      title: '表单',
      dataIndex: 'forms',
      colProps: { span: 24 },
      formItemProps: {
        rules: [{ required: true, message: '编码为必填项' }],
      },
      renderFormItem: (_, __, form) => {
        return (
          <Space.Compact style={{ width: '100%' }}>
            <Input
              value={form.getFieldValue('forms')?.map((item: any) => item.name)}
              onClick={() => {
                transfer.command.emitter('data', 'file', {
                  prop: 'forms',
                  multiple: true,
                  accepts: ['实体配置', '事项配置'],
                });
              }}
            />
            <Button
              size="small"
              onClick={async () => {
                let sheets = await transfer.template<schema.XThing>(current);
                let root = transfer.directory.target.directory;
                let map = (sheet: any) => new AnyHandler({ ...sheet, dir: root });
                let handlers = sheets.map(map);
                generateXlsx(new Excel(handlers), '表单模板');
              }}>
              下载模板
            </Button>
          </Space.Compact>
        );
      },
    },
    {
      title: '文件',
      dataIndex: 'file',
      colProps: { span: 24 },
      formItemProps: {
        rules: [{ required: true, message: '表格文件为必填项' }],
      },
      renderFormItem: (_, __, form) => {
        return (
          <Input
            value={form.getFieldValue('file')?.name}
            onClick={() => {
              transfer.command.emitter('data', 'file', {
                prop: 'file',
                accepts: ['Office'],
              });
            }}
          />
        );
      },
    },
    {
      title: '前置脚本',
      dataIndex: 'preScripts',
      colProps: { span: 24 },
      renderFormItem: (_, __, form) => {
        return (
          <CodeMirror
            value={form.getFieldValue('preScripts')}
            height={'200px'}
            extensions={[javascript()]}
            onChange={(code: string) => {
              form.setFieldValue('preScripts', code);
            }}
          />
        );
      },
    },
    {
      title: '后置脚本',
      dataIndex: 'postScripts',
      colProps: { span: 24 },
      renderFormItem: (_, __, form) => {
        return (
          <CodeMirror
            value={form.getFieldValue('postScripts')}
            height={'200px'}
            extensions={[javascript()]}
            onChange={(code: string) => {
              form.setFieldValue('postScripts', code);
            }}
          />
        );
      },
    },
    {
      title: '备注',
      dataIndex: 'remark',
      valueType: 'textarea',
      colProps: { span: 24 },
    },
  ];
  return (
    <SchemaForm<model.Tables>
      formRef={form}
      open
      title="表格定义"
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
        await transfer.updNode({ ...current, ...values });
        finished();
      }}
    />
  );
};

export { ExcelForm };
