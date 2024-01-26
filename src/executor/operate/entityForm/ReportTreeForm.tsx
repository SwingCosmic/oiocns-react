import React from 'react';
import { ProFormColumnsType } from '@ant-design/pro-components';
import SchemaForm from '@/components/SchemaForm';
import { IDirectory } from '@/ts/core';
import UploadItem from '../../tools/uploadItem';
import { EntityColumns } from './entityColumns';
import { schema } from '@/ts/base';
import { IReportTree } from '@/ts/core/thing/standard/reporttree';

interface Iprops {
  formType: string;
  current: IDirectory | IReportTree;
  finished: () => void;
}
/*
  编辑
*/
const ReportTreeForm = (props: Iprops) => {
  let title = '';
  let directory: IDirectory;
  let tree: IReportTree | undefined;
  const readonly = props.formType === 'remark';
  let initialValue: any = props.current.metadata;
  switch (props.formType) {
    case 'newReportTree':
      title = '新建报表树';
      initialValue = {};
      directory = props.current as IDirectory;
      break;
    default:
      return <></>;
  }
  const columns: ProFormColumnsType<schema.XReportTree>[] = [
    {
      title: '图标',
      dataIndex: 'icon',
      colProps: { span: 24 },
      renderFormItem: (_, __, form) => {
        return (
          <UploadItem
            readonly={readonly}
            typeName={"报表树"}
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
        rules: [{ required: true, message: '报表树名称为必填项' }],
      },
    },
    {
      title: '代码',
      dataIndex: 'code',
      readonly: readonly,
      formItemProps: {
        rules: [{ required: true, message: '报表树代码为必填项' }],
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
    <SchemaForm<schema.XReportTree>
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
        values.typeName = "报表树";
        switch (props.formType) {
          case 'update':
            await tree!.update(values);
            break;
          case 'new':
            await directory.standard.createReportTree(values);
            break;
        }
        props.finished();
      }}
    />
  );
};

export default ReportTreeForm;
