import OpenFileDialog from '@/components/OpenFileDialog';
import SchemaForm from '@/components/SchemaForm';
import { schema } from '@/ts/base';
import { IFinancial } from '@/ts/core';
import { IClosingOptions } from '@/ts/core/work/financial/config/closing';
import {
  ProFormColumnsType,
  ProFormInstance,
  ProTable,
} from '@ant-design/pro-components';
import { Button, Input, Select, Space } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { FullScreen } from '..';

interface FormProps {
  closingOptions: IClosingOptions;
  current: schema.XClosingOption | undefined;
  formType: string;
  finished: () => void;
}

const ClosingForm: React.FC<FormProps> = (props: FormProps) => {
  const ref = useRef<ProFormInstance>();
  const [needType, setNeedType] = useState<string>();
  const [speciesItems, setSpeciesItems] = useState<schema.XSpeciesItem[]>([]);
  const loadSpeciesItems = async (speciesId: string) => {
    const items = await props.closingOptions.financial.loadSpeciesItems(speciesId);
    setSpeciesItems(items);
  };
  let initialValues: any = { dimensions: [], fields: [] };
  switch (props.formType) {
    case 'update':
      initialValues = props.current as schema.XClosingOption;
      break;
  }
  useEffect(() => {
    if (props.formType === 'update') {
      if (
        props.current &&
        props.current.accounting &&
        props.current.accounting.speciesId
      ) {
        loadSpeciesItems(props.current.accounting.speciesId);
      }
    }
  }, []);
  const columns: ProFormColumnsType<schema.XClosingOption>[] = [
    {
      title: '会计科目代码',
      dataIndex: 'code',
      readonly: props.formType === 'update',
    },
    {
      title: '会计科目名称',
      dataIndex: 'name',
      readonly: props.formType === 'update',
    },
    {
      title: '会计科目字段',
      dataIndex: 'accounting',
      formItemProps: {
        rules: [{ required: true, message: '会计科目字段' }],
      },
      renderFormItem: (_, __, form) => {
        return (
          <Input
            allowClear
            onClick={() => setNeedType('accounting')}
            value={form.getFieldValue('accounting')?.name}
          />
        );
      },
    },
    {
      title: '会计科目字段值',
      dataIndex: 'accountingValue',
      valueType: 'select',
      formItemProps: {
        rules: [{ required: true, message: '会计科目字段值' }],
      },
      renderFormItem: (_, __, form) => {
        return (
          <Select
            allowClear
            onSelect={(value) => {
              for (const item of speciesItems) {
                if (item.id === value) {
                  form.setFieldValue('accountingValue', item.id);
                  form.setFieldValue('code', item.info);
                  form.setFieldValue('name', item.name);
                }
              }
            }}
            options={speciesItems.map((i) => {
              return {
                value: i.id,
                label: i.name,
              };
            })}
          />
        );
      },
    },
    {
      title: '统计字段（原值、累计折旧）',
      dataIndex: 'amount',
      formItemProps: {
        rules: [{ required: true, message: '分类维度为必填项' }],
      },
    },
    {
      title: '资产负债表字段',
      dataIndex: 'financial',
      formItemProps: {
        rules: [{ required: true, message: '会计科目字段值' }],
      },
      renderFormItem: (_, __, form) => {
        return (
          <Input
            allowClear
            onClick={() => setNeedType('financial')}
            value={form.getFieldValue('financial')?.name}
          />
        );
      },
    },
  ];
  const accepts = (needType: string) => {
    switch (needType) {
      case 'accounting':
        return ['变更源'];
      case 'amount':
        return ['可记录的'];
    }
    return [];
  };
  return (
    <>
      <SchemaForm<schema.XClosingOption>
        open
        title={'方案操作'}
        width={640}
        formRef={ref}
        columns={columns}
        initialValues={initialValues}
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
            case 'update': {
              await props.closingOptions.update({
                ...props.current,
                ...values,
              });
              break;
            }
            case 'new': {
              await props.closingOptions.create(values);
              break;
            }
          }
          props.finished();
        }}
      />
      {needType && (
        <OpenFileDialog
          title={`选择属性`}
          rootKey={props.closingOptions.financial.space.directory.spaceKey}
          accepts={accepts(needType)}
          onCancel={() => setNeedType(undefined)}
          onOk={(files) => {
            if (files.length > 0) {
              switch (needType) {
                case 'accounting':
                  const accounting = files[0].metadata as schema.XProperty;
                  ref.current?.setFieldValue(needType, accounting);
                  if (accounting.speciesId) {
                    loadSpeciesItems(accounting.speciesId);
                  }
                  break;
                case 'amount':
                  ref.current?.setFieldValue(needType, files[0].metadata);
                  break;
              }
            }
            setNeedType(undefined);
          }}
        />
      )}
    </>
  );
};

interface TemplateProps {
  financial: IFinancial;
  onFinished?: () => void;
  onCancel?: () => void;
}

export const ClosingTemplate: React.FC<TemplateProps> = (props) => {
  const [center, setCenter] = useState(<></>);
  const [data, setData] = useState(props.financial.closingOptions.options);
  useEffect(() => {
    const id = props.financial.closingOptions.subscribe(async () => {
      const data = await props.financial.closingOptions.loadOptions();
      setData([...data]);
    });
    return () => {
      props.financial.closingOptions.unsubscribe(id);
    };
  }, []);
  return (
    <>
      <FullScreen
        title={'月结模板配置'}
        onFinished={props.onFinished}
        onCancel={props.onCancel}>
        <div style={{ width: '100%', textAlign: 'right' }}>
          <Space align="end">
            <Button
              onClick={() => {
                setCenter(
                  <ClosingForm
                    closingOptions={props.financial.closingOptions}
                    current={undefined}
                    formType={'new'}
                    finished={() => setCenter(<></>)}
                  />,
                );
              }}>
              新增
            </Button>
          </Space>
        </div>
        <ProTable<schema.XClosingOption>
          rowKey={'id'}
          style={{ marginTop: 8 }}
          search={false}
          options={false}
          dataSource={data}
          columns={[
            {
              dataIndex: 'code',
              title: '会计科目代码',
              readonly: true,
            },
            {
              dataIndex: 'name',
              title: '会计科目名称',
              readonly: true,
            },
            {
              dataIndex: 'amount',
              title: '统计字段（原值、累计折旧）',
              render: (_, row) => {
                return row.amount.name;
              },
            },
            {
              dataIndex: 'financial',
              title: '资产负债表字段',
              render: (_, row) => {
                return row.financial.name;
              },
            },
            {
              title: '操作',
              render: (_, row) => {
                return (
                  <Space>
                    <a
                      onClick={() => {
                        setCenter(
                          <ClosingForm
                            closingOptions={props.financial.closingOptions}
                            current={row}
                            formType={'update'}
                            finished={() => setCenter(<></>)}
                          />,
                        );
                      }}>
                      修改
                    </a>
                    <a onClick={() => props.financial.closingOptions.remove(row)}>删除</a>
                  </Space>
                );
              },
            },
          ]}
        />
      </FullScreen>
      {center}
    </>
  );
};
