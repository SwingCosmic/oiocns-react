import { RangePicker } from '@/components/Common/StringDatePickers/RangePicker';
import { common, model } from '@/ts/base';
import { Node } from '@/ts/base/common';
import { IFinancial } from '@/ts/core';
import { IPeriod } from '@/ts/core/work/financial/period';
import { IQuery } from '@/ts/core/work/financial/statistics/query';
import { SumItem } from '@/ts/core/work/financial/statistics/summary';
import { formatNumber } from '@/utils';
import { ProTable } from '@ant-design/pro-components';
import { json } from '@codemirror/lang-json';
import CodeMirror from '@uiw/react-codemirror';
import { Button, Modal, Select, Space, Spin, Table, message } from 'antd';
import { ColumnGroupType, ColumnType, ColumnsType } from 'antd/lib/table';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { FullScreen } from '..';
import cls from './ledger.module.less';
import { LedgerModal } from './ledgerModel';

export interface SummaryColumn {
  label: string;
  prefix: string;
}

const columns: SummaryColumn[] = [
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

interface FormProps {
  current: IFinancial;
  formType: string;
  finished: () => void;
}

const QueryForm: React.FC<FormProps> = (props: FormProps) => {
  const [data, setData] = useState<string>('{}');
  return (
    <FullScreen
      title={'查询方案配置'}
      onFinished={props.finished}
      onCancel={props.finished}
      onSave={async () => {
        try {
          await props.current.createQuery(JSON.parse(data));
          props.finished();
        } catch (e) {
          message.error(`数据格式错误${data}`);
        }
      }}>
      <CodeMirror
        style={{ marginTop: 10 }}
        value={data}
        height={'90vh'}
        extensions={[json()]}
        onChange={(value) => {
          setData(value);
        }}
      />
    </FullScreen>
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

async function loadColumn(
  query: IQuery,
  onClick: (prefix: SummaryColumn, field: model.FieldModel, data: Node<SumItem>) => void,
): Promise<ColumnsType<Node<SumItem>>> {
  const nodes: ColumnType<Node<SumItem>>[] = [
    {
      title: query.species.name,
      render: (_, row) => {
        return row.data.name;
      },
    },
  ];
  const root: ColumnGroupType<Node<SumItem>> = {
    title: '根',
    children: [],
  };
  query.summary.summaryRecursion<ColumnGroupType<Node<SumItem>>>({
    speciesItems: await query.loadSpecies(),
    dimensions: query.dimensions.map((item) => item.id),
    dimensionPath: 'root',
    context: root,
    summary: (path, context) => {
      query.fields.map((field) => {
        context?.children.push({
          key: field.id,
          title: field.name,
          children: columns.map((item) => {
            const prop = item.prefix + '-' + path + '-' + field.id;
            const column: ColumnType<Node<SumItem>> = {
              key: prop,
              align: 'right',
              title: item.label,
            };
            if (['plus', 'minus'].includes(item.prefix)) {
              column.render = (_, row) => {
                return (
                  <div className="cell-link" onClick={() => onClick(item, field, row)}>
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
    buildNext: (item, context) => {
      const node = {
        title: item.name,
        children: [],
      };
      context?.children.push(node);
      return node;
    },
  });
  nodes.push(...root.children);
  return nodes;
}

const Ledger: React.FC<IProps> = ({ financial, period }) => {
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState<[string, string]>([period.period, period.period]);
  const [query, setQuery] = useState(financial.query);
  const [queries, setQueries] = useState<IQuery[]>(financial.queries);
  const [data, setData] = useState<common.Tree<SumItem> | undefined>();
  const [columns, setColumns] = useState<ColumnsType<Node<SumItem>>>([]);
  const [center, setCenter] = useState(<></>);

  async function loadData() {
    try {
      setLoading(true);
      const queries = await financial.loadQueries();
      const columns = [];
      if (financial.query) {
        const start = financial.getOffsetPeriod(month[0], -1);
        const data = await financial.query.ledgerSummary(start, month[1]);
        columns.push(
          ...(await loadColumn(financial.query, (prefix, field, node) => {
            setCenter(
              <LedgerModal
                query={financial.query!}
                tree={data!}
                between={month}
                symbol={prefix.prefix == 'plus' ? 1 : -1}
                node={node}
                field={field}
                finished={() => setCenter(<></>)}
              />,
            );
          })),
        );
        setData(data);
      }
      setQueries(queries);
      setQuery(financial.query);
      setColumns(columns);
    } finally {
      setLoading(false);
    }
  }

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
                disabledDate={(current) => {
                  if (financial.initialized) {
                    return (
                      current &&
                      (current <
                        moment(financial.getOffsetPeriod(financial.initialized, 1)) ||
                        current > moment(financial.current))
                    );
                  }
                  return false;
                }}
              />
              <Button onClick={loadData}>刷新</Button>
            </Space>
          </div>
          <div className={cls.content}>
            <Table<Node<SumItem>>
              rowKey={'id'}
              sticky
              columns={columns}
              pagination={false}
              bordered
              size="small"
              dataSource={data?.root.children ?? []}
              scroll={{ y: 'calc(100%)' }}
            />
          </div>
        </div>
      </Spin>
      {center}
    </div>
  );
};

export default Ledger;
