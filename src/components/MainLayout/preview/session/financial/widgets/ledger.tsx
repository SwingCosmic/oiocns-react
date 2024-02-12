import { RangePicker } from '@/components/Common/StringDatePickers/RangePicker';
import { schema } from '@/ts/base';
import { Node, deepClone } from '@/ts/base/common';
import { IFinancial } from '@/ts/core';
import { ItemSummary } from '@/ts/core/work/financial';
import { IPeriod } from '@/ts/core/work/financial/period';
import {
  ProFormColumnsType,
  ProFormInstance,
  ProTable,
} from '@ant-design/pro-components';
import { Button, Input, Modal, Select, Space, Spin, Table } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import cls from './ledger.module.less';
import { AssetLedgerModal } from './ledgetModel';
import SchemaForm from '@/components/SchemaForm';
import OpenFileDialog from '@/components/OpenFileDialog';
import { IQuery } from '@/ts/core/work/financial/query';
import { formatNumber } from '@/utils';
import { ColumnGroupType, ColumnType, ColumnsType } from 'antd/lib/table';

interface FormProps {
  current: IFinancial | IQuery;
  formType: string;
  finished: () => void;
}

const QueryForm: React.FC<FormProps> = (props: FormProps) => {
  const ref = useRef<ProFormInstance>();
  const [needType, setNeedType] = useState<string>();
  let initialValues: any = { dimensions: [], fields: [] };
  switch (props.formType) {
    case 'updateQuery':
      initialValues = props.current.metadata as schema.XQuery;
      break;
  }
  const columns: ProFormColumnsType<schema.XQuery>[] = [
    {
      title: '名称',
      dataIndex: 'name',
      formItemProps: {
        rules: [{ required: true, message: '分类名称为必填项' }],
      },
    },
    {
      title: '代码',
      dataIndex: 'code',
      formItemProps: {
        rules: [{ required: true, message: '分类代码为必填项' }],
      },
    },
    {
      title: '分类维度',
      dataIndex: 'species',
      formItemProps: {
        rules: [{ required: true, message: '分类维度为必填项' }],
      },
      renderFormItem: (_, __, form) => {
        return (
          <Input
            allowClear
            onClick={() => setNeedType('species')}
            value={form.getFieldValue('species')?.name}
          />
        );
      },
    },
    {
      title: '扩展维度',
      dataIndex: 'dimensions',
      renderFormItem: (_, __, form) => {
        return (
          <Input
            allowClear
            onClick={() => setNeedType('dimensions')}
            value={(form.getFieldValue('dimensions') || [])
              ?.map((item: any) => item.name)
              .join('、')}
          />
        );
      },
    },
    {
      title: '统计字段',
      dataIndex: 'fields',
      formItemProps: {
        rules: [{ required: true, message: '扩展维度为必填项' }],
      },
      renderFormItem: (_, __, form) => {
        console.log(form.getFieldValue('fields'));
        return (
          <Input
            allowClear
            onClick={() => setNeedType('fields')}
            value={(form.getFieldValue('fields') || [])
              ?.map((item: any) => item.name)
              .join('、')}
          />
        );
      },
    },
    {
      title: '备注信息',
      dataIndex: 'remark',
      valueType: 'textarea',
      colProps: { span: 24 },
      formItemProps: {
        rules: [{ required: true, message: '备注信息为必填项' }],
      },
    },
  ];
  const accepts = (needType: string) => {
    switch (needType) {
      case 'dimensions':
      case 'species':
        return ['变更源'];
      case 'fields':
        return ['可记录的'];
    }
    return [];
  };
  return (
    <>
      <SchemaForm<schema.XQuery>
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
          values.dimensions = values.dimensions || [];
          values.fields = values.fields || [];
          switch (props.formType) {
            case 'updateQuery': {
              const query = props.current as IQuery;
              await query.update(values);
              break;
            }
            case 'newQuery': {
              const financial = props.current as IFinancial;
              await financial.createQuery(values);
              break;
            }
          }
          props.finished();
        }}
      />
      {needType && (
        <OpenFileDialog
          title={`选择属性`}
          rootKey={props.current.space.directory.spaceKey}
          accepts={accepts(needType)}
          multiple={['dimensions', 'fields'].includes(needType)}
          onCancel={() => setNeedType(undefined)}
          onOk={(files) => {
            if (files.length > 0) {
              switch (needType) {
                case 'dimensions':
                  ref.current?.setFieldsValue({
                    dimensions: files.map((item) => {
                      return { ...deepClone(item.metadata), id: 'T' + item.id };
                    }),
                  });
                  break;
                case 'fields':
                  ref.current?.setFieldsValue({
                    fields: files.map((item) => {
                      return { ...deepClone(item.metadata), id: 'T' + item.id };
                    }),
                  });
                  break;
                case 'species': {
                  const metadata = files[0].metadata;
                  ref.current?.setFieldsValue({
                    species: { ...deepClone(metadata), id: 'T' + metadata.id },
                  });
                  break;
                }
              }
            }
            setNeedType(undefined);
          }}
        />
      )}
    </>
  );
};

interface QueryProps {
  financial: IFinancial;
  finished: () => void;
}

const QueryList: React.FC<QueryProps> = ({ financial, finished }) => {
  const [queries, setQueries] = useState<IQuery[]>([]);
  const [center, setCenter] = useState(<></>);
  useEffect(() => {
    const id = financial.subscribe(() => {
      financial.loadQueries().then((queries) => setQueries([...queries]));
    });
    return () => {
      financial.unsubscribe(id);
    };
  }, []);
  return (
    <>
      <Modal
        open={true}
        title={'查询方案'}
        maskClosable
        width={1200}
        bodyStyle={{ maxHeight: '60vh' }}
        destroyOnClose
        onCancel={finished}
        onOk={finished}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space>
            <Button
              onClick={() => {
                setCenter(
                  <QueryForm
                    current={financial}
                    formType="newQuery"
                    finished={() => setCenter(<></>)}
                  />,
                );
              }}>
              新增查询方案
            </Button>
          </Space>
          <ProTable<IQuery>
            dataSource={queries}
            search={false}
            options={false}
            columns={[
              {
                title: '序号',
                valueType: 'index',
              },
              {
                title: '编码',
                dataIndex: 'code',
                valueType: 'text',
              },
              {
                title: '名称',
                dataIndex: 'name',
                valueType: 'text',
              },
              {
                title: '分类维度',
                dataIndex: 'species',
                render: (_, record) => {
                  return record.species.name;
                },
              },
              {
                title: '扩展维度',
                dataIndex: 'dimensions',
                render: (_, record) => {
                  return record.dimensions.map((d) => d.name).join('、');
                },
              },
              {
                title: '统计字段',
                dataIndex: 'fields',
                render: (_, record) => {
                  return record.fields.map((f) => f.name).join('、');
                },
              },
              {
                title: '操作',
                valueType: 'option',
                render: (_, record) => {
                  return [
                    <a
                      key="edit"
                      onClick={() => {
                        setCenter(
                          <QueryForm
                            current={record}
                            formType="updateQuery"
                            finished={() => setCenter(<></>)}
                          />,
                        );
                      }}>
                      更新
                    </a>,
                    <a key="remove" onClick={() => record.remove()}>
                      删除
                    </a>,
                  ];
                },
              },
            ]}
          />
        </Space>
      </Modal>
      {center}
    </>
  );
};

interface IProps {
  financial: IFinancial;
  period: IPeriod;
}

const columns = [
  {
    label: '期初',
    prefix: 'before',
  },
  {
    label: '增加',
    prefix: 'plus',
  },
  {
    label: '减少',
    prefix: 'minus',
  },
  {
    label: '期末',
    prefix: 'after',
  },
];

async function loadColumn(query: IQuery): Promise<ColumnsType<Node<ItemSummary>>> {
  const res = await query.loadSpecies();
  const nodes: ColumnType<Node<ItemSummary>>[] = [
    {
      title: query.species.name,
      render: (_, row) => {
        return row.data.name;
      },
    },
  ];
  const root: ColumnGroupType<Node<ItemSummary>> = {
    title: '根',
    children: [],
  };
  query.recursion<ColumnGroupType<Node<ItemSummary>>>(
    res,
    'summary-',
    (path, context) => {
      query.fields.map((field) => {
        context?.children.push({
          key: field.id,
          title: field.name,
          children: columns.map((item) => {
            const prop = item.prefix + '-' + path + field.id;
            const column: ColumnType<Node<ItemSummary>> = {
              key: prop,
              align: 'right',
              title: item.label,
            };
            if (['plus', 'minus'].includes(item.prefix)) {
              column.render = (_, row) => {
                return (
                  <div className="cell-link">
                    {formatNumber(row.data[prop] ?? 0, 2, true)}
                  </div>
                );
              };
            } else {
              column.render = (_, row) => {
                return <div>{formatNumber(row.data[prop] ?? 0, 2, true)}</div>;
              };
            }
            return column;
          }),
        });
      });
    },
    root,
    (item, context) => {
      const node = {
        title: item.name,
        children: [],
      };
      context?.children.push(node);
      return node;
    },
  );
  nodes.push(...root.children);
  return nodes;
}

const Ledger: React.FC<IProps> = ({ financial, period }) => {
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState<[string, string]>([period.period, period.period]);
  const [query, setQuery] = useState(financial.query);
  const [queries, setQueries] = useState<IQuery[]>(financial.queries);
  const [data, setData] = useState<Node<schema.XSpeciesItem>[]>([]);
  const [detailVisible, setDetailVisible] = useState(false);
  const [columns, setColumns] = useState<ColumnsType<Node<ItemSummary>>>([]);
  const [currentRow, setCurrentRow] = useState<Node<ItemSummary> | null>(null);
  const [currentField, setCurrentField] = useState('');
  const [currentType, setCurrentType] = useState('');
  const [center, setCenter] = useState(<></>);

  async function loadData() {
    try {
      setLoading(true);
      const queries = await financial.loadQueries();
      const columns = [];
      const data = [];
      if (financial.query) {
        columns.push(...(await loadColumn(financial.query)));
        data.push(...(await financial.query.summaryRange(month[0], month[1])));
      }

      setQueries(queries);
      setQuery(financial.query);
      setColumns(columns);
      setData(data);
    } finally {
      setLoading(false);
    }
  }

  const handleViewDetail = useCallback(
    async (row: Node<ItemSummary>, field: string, type: string) => {
      setCurrentRow(row);
      setCurrentField(field);
      setCurrentType(type);
      setDetailVisible(true);
    },
    [],
  );

  useEffect(() => {
    const id = financial.subscribe(() => loadData());
    return () => {
      financial.unsubscribe(id);
    };
  }, [month, query]);

  return (
    <div className={cls.assetLedger + ' asset-page-element'}>
      <Spin spinning={loading}>
        <div className="flex flex-col gap-2" style={{ height: '100%' }}>
          <div className="asset-page-element__topbar">
            <span className={cls.title}>全部资产</span>
            <div className="flex-auto"></div>
            <Space>
              <a
                onClick={() =>
                  setCenter(
                    <QueryList financial={financial} finished={() => setCenter(<></>)} />,
                  )
                }>
                查询方案
              </a>
              <Select
                style={{ width: 200 }}
                placeholder="选择查询方案"
                value={query?.id}
                onSelect={(value) => {
                  const query = queries.find((item) => item.id == value);
                  if (query) {
                    financial.setQuery(query.metadata);
                  }
                }}
                options={queries?.map((item) => {
                  return {
                    value: item.id,
                    label: item.name,
                  };
                })}
              />
              <div>月份范围</div>
              <RangePicker
                picker="month"
                value={month}
                onChange={setMonth}
                format="YYYY-MM"
              />
              <Button onClick={loadData}>刷新</Button>
            </Space>
          </div>
          <div className={cls.content}>
            <Table<Node<ItemSummary>>
              rowKey={'id'}
              sticky
              columns={columns}
              pagination={false}
              bordered
              size="small"
              dataSource={data}
              scroll={{ y: 'calc(100%)' }}
            />
          </div>
        </div>
      </Spin>

      {detailVisible ? (
        <AssetLedgerModal
          summary={currentRow}
          field={currentField}
          type={currentType}
          visible={detailVisible}
          onVisibleChange={setDetailVisible}
          form={null!}
        />
      ) : (
        <></>
      )}
      {center}
    </div>
  );
};

export default Ledger;
