import { RangePicker } from '@/components/Common/StringDatePickers/RangePicker';
import OpenFileDialog from '@/components/OpenFileDialog';
import { schema } from '@/ts/base';
import { Node, deepClone } from '@/ts/base/common';
import { IFinancial } from '@/ts/core';
import { ItemSummary } from '@/ts/core/work/financial';
import { IPeriod } from '@/ts/core/work/financial/period';
import { formatNumber } from '@/utils';
import { CloseCircleOutlined, PlusCircleOutlined } from '@ant-design/icons';
import { Button, Space, Spin, Table } from 'antd';
import { ColumnType } from 'antd/lib/table';
import React, { useCallback, useEffect, useState } from 'react';
import { AssetLedgerModal } from './AssetLedgerModal';
import { prefixMap } from './config';
import cls from './ledger.module.less';

interface IProps {
  financial: IFinancial;
  period: IPeriod;
}

const AssetLedger: React.FC<IProps> = ({ financial, period }) => {
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState<[string, string]>([period.period, period.period]);
  const [data, setData] = useState<Node<schema.XSpeciesItem>[]>([]);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentRow, setCurrentRow] = useState<Node<ItemSummary> | null>(null);
  const [currentField, setCurrentField] = useState('');
  const [currentType, setCurrentType] = useState('');
  const [species, setSpecies] = useState(financial.metadata?.species);
  const [fields, setFields] = useState(financial.fields);
  const [center, setCenter] = useState(<></>);

  async function loadData() {
    if (!species) {
      return;
    }
    try {
      setLoading(true);
      const data = await financial.summaryRange(month[0], month[1]);
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
    const id = financial.subscribe(() => {
      setSpecies(financial.metadata?.species);
      setFields(financial.metadata?.fields ?? []);
      loadData();
    });
    return () => {
      financial.unsubscribe(id);
    };
  }, [month, species]);

  return (
    <div className={cls.assetLedger + ' asset-page-element'}>
      <Spin spinning={loading}>
        <div className="flex flex-col gap-2" style={{ height: '100%' }}>
          <div className="asset-page-element__topbar">
            <span className={cls.title}>全部资产</span>
            <div className="flex-auto"></div>
            <div>月份范围</div>
            <RangePicker
              picker="month"
              value={month}
              onChange={setMonth}
              format="YYYY-MM"
            />
            <Button onClick={loadData}>刷新</Button>
          </div>
          <div className={cls.content}>
            <Table<Node<ItemSummary>>
              rowKey={'id'}
              sticky
              pagination={false}
              bordered
              size="small"
              dataSource={data}
              scroll={{ y: 'calc(100%)' }}>
              <Table.Column<Node<ItemSummary>>
                width={320}
                title={
                  <Space>
                    <a
                      onClick={() => {
                        setCenter(
                          <OpenFileDialog
                            accepts={['变更源']}
                            rootKey={financial.space.directory.key}
                            onOk={async (files) => {
                              if (files.length > 0) {
                                const metadata = files[0].metadata as schema.XProperty;
                                const result = deepClone(metadata);
                                result.id = "T" + result.id;
                                financial.setSpecies(result);
                              }
                              setCenter(<></>);
                            }}
                            onCancel={() => {
                              setCenter(<></>);
                            }}
                          />,
                        );
                      }}>
                      {species?.name ?? '选择统计维度'}
                    </a>
                    <Button
                      icon={<PlusCircleOutlined />}
                      size="small"
                      onClick={() => {
                        setCenter(
                          <OpenFileDialog
                            accepts={['可记录的']}
                            rootKey={financial.space.directory.key}
                            excludeIds={fields.map((f) => f.id.replace('T', ''))}
                            multiple
                            onOk={async (files) => {
                              if (files.length > 0) {
                                const items = [
                                  ...fields,
                                  ...files.map((item) => {
                                    const metadata = deepClone(
                                      item.metadata as schema.XProperty,
                                    );
                                    metadata.id = 'T' + metadata.id;
                                    return metadata;
                                  }),
                                ];
                                financial.setFields(items);
                              }
                              setCenter(<></>);
                            }}
                            onCancel={function (): void {
                              setCenter(<></>);
                            }}
                          />,
                        );
                      }}>
                      添加统计字段
                    </Button>
                  </Space>
                }
                render={(_, row) => {
                  return row.data.name;
                }}
              />
              {fields.map((field) => (
                <Table.ColumnGroup
                  key={field.id}
                  title={
                    <Space>
                      <span>{field.name}</span>
                      <CloseCircleOutlined
                        onClick={() => {
                          financial.setFields(fields.filter((f) => f.id != field.id));
                        }}
                      />
                    </Space>
                  }>
                  {prefixMap.map((item) => {
                    const prop = item.prefix + '-' + field.id;
                    const column: ColumnType<Node<ItemSummary>> = {
                      title: item.label,
                      dataIndex: item.prefix + field.id,
                      align: 'right',
                      key: item.prefix,
                    };
                    if (['plus', 'minus'].includes(item.prefix)) {
                      column.render = (_, row) => {
                        return (
                          <div
                            className="cell-link"
                            onClick={() => handleViewDetail(row, field.id, item.prefix)}>
                            {formatNumber(row.data[prop] ?? 0, 2, true)}
                          </div>
                        );
                      };
                    } else {
                      column.render = (_, row) => {
                        return <div>{formatNumber(row.data[prop] ?? 0, 2, true)}</div>;
                      };
                    }
                    return <Table.Column<Node<ItemSummary>> {...column} />;
                  })}
                </Table.ColumnGroup>
              ))}
            </Table>
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

export default AssetLedger;
