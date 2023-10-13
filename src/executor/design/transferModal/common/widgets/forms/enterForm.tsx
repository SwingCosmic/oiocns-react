import SchemaForm from '@/components/SchemaForm';
import { model } from '@/ts/base';
import { IDirectory, ITransfer } from '@/ts/core';
import { ProFormColumnsType, ProFormInstance } from '@ant-design/pro-components';
import React, { useRef, useState } from 'react';
import { MenuItem, expand, loadFormsMenu } from '../menus';

interface IProps {
  transfer: ITransfer;
  current: model.Form;
  finished: () => void;
}

const getExpandKeys = (treeData: MenuItem[]) => {
  return expand(treeData, ['事项配置', '实体配置']);
};

export const EnterForm: React.FC<IProps> = ({ transfer, current, finished }) => {
  console.log(transfer, current, finished);
  const formRef = useRef<ProFormInstance>();
  const [treeData, setTreeData] = useState<MenuItem[]>([
    loadFormsMenu(transfer.directory.target.directory),
  ]);
  const columns: ProFormColumnsType<model.Form>[] = [
    {
      title: '名称',
      dataIndex: 'name',
      formItemProps: {
        rules: [{ required: true, message: '名称为必填项' }],
      },
    },
    {
      title: '编码',
      dataIndex: 'code',
      formItemProps: {
        rules: [{ required: true, message: '编码为必填项' }],
      },
    },
    {
      title: '表单',
      dataIndex: 'formId',
      valueType: 'treeSelect',
      formItemProps: {
        rules: [{ required: true, message: '表单为必填项' }],
      },
      colProps: { span: 24 },
      fieldProps: {
        fieldNames: {
          label: 'label',
          value: 'key',
          children: 'children',
        },
        showSearch: true,
        loadData: async (node: MenuItem): Promise<void> => {
          if (!node.isLeaf) {
            let forms = (node.item as IDirectory).standard.forms;
            if (forms.length > 0) {
              setTreeData([loadFormsMenu(transfer.directory)]);
            }
          }
        },
        treeNodeFilterProp: 'label',
        treeDefaultExpandedKeys: getExpandKeys(treeData),
        treeData: treeData,
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
    <SchemaForm<model.Form>
      open
      formRef={formRef}
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
        const node = { ...current, ...values };
        await transfer.updNode(node);
        finished();
      }}
    />
  );
};
