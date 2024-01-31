import { RangePicker } from '@/components/Common/StringDatePickers/RangePicker';
import OpenFileDialog from '@/components/OpenFileDialog';
import { schema } from '@/ts/base';
import { IFinancial } from '@/ts/core';
import { IPeriod } from '@/ts/core/financial/period';
import { formatNumber } from '@/utils';
import { CloseCircleOutlined, PlusCircleOutlined } from '@ant-design/icons';
import { Breadcrumb, Button, Space, Spin, Table } from 'antd';
import { ColumnType } from 'antd/lib/table';
import _ from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import { useEffectOnce } from 'react-use';
import { AssetLedgerModal } from './AssetLedgerModal';
import { AssetLedgerSummary, prefixMap } from './config';
import cls from './ledger.module.less';
import testdata from './testdata';

type BreadcrumbItemType = Pick<AssetLedgerSummary, 'assetTypeId' | 'assetTypeName'>;

interface IProps {
  financial: IFinancial;
  period: IPeriod;
}

const AssetLedger: React.FC<IProps> = ({ financial, period }) => {
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  const [month, setMonth] = useState<[string, string]>([period.period, period.period]);

  const [data, setData] = useState<AssetLedgerSummary[]>([]);
  const [parentId, setParentId] = useState('');
  const [parentPath, setParentPath] = useState<BreadcrumbItemType[]>([]);

  const [detailVisible, setDetailVisible] = useState(false);
  const [currentRow, setCurrentRow] = useState<AssetLedgerSummary | null>(null);
  const [currentField, setCurrentField] = useState('');
  const [currentType, setCurrentType] = useState('');
  const [species, setSpecies] = useState(financial.metadata?.species);
  const [fields, setFields] = useState(financial.fields);
  const [center, setCenter] = useState(<></>);

  async function init() {
    setReady(true);
  }

  async function loadData() {
    try {
      setLoading(true);

      period.summary();
      const res = await financial.loadSpecies(true);

      await new Promise<void>((s) => setTimeout(() => s(), 2000));

      let roots: AssetLedgerSummary[] = res
        .filter((s) => (parentId ? s.parentId == parentId : !s.parentId))
        .map((s) => {
          const ret = _.cloneDeep(testdata[_.random(0, testdata.length - 1)]);
          ret.assetTypeId = s.id;
          ret.assetTypeName = s.name;
          ret.belongId = financial.space.id;

          ret.canClick = false;
          ret.isParent = true;

          return ret;
        });

      for (const root of [...roots]) {
        const children = res
          .filter((s) => s.parentId == root.assetTypeId)
          .map((s) => {
            const ret = _.cloneDeep(testdata[_.random(0, testdata.length - 1)]);
            ret.assetTypeId = s.id;
            ret.assetTypeName = s.name;

            ret.canClick = res.filter((c) => c.parentId == s.id).length > 0;
            ret.isParent = false;

            return ret;
          });
        const index = roots.indexOf(root);
        roots.splice(index + 1, 0, ...children);
      }

      setData(roots);
    } finally {
      setLoading(false);
    }
  }

  const handleViewDetail = useCallback(
    async (row: AssetLedgerSummary, field: string, type: string) => {
      setCurrentRow(row);
      setCurrentField(field);
      setCurrentType(type);

      setDetailVisible(true);
    },
    [],
  );

  function handleExpand(row: AssetLedgerSummary) {
    setCurrentRow(row);
    setParentId(row.assetTypeId);

    parentPath.push(_.pick(row, ['assetTypeId', 'assetTypeName']));
    setParentPath(parentPath);
  }

  function handleBack(item?: BreadcrumbItemType) {
    if (!item) {
      setCurrentRow(null);
      setParentId('');
      setParentPath([]);
      return;
    }

    const row = data.find((d) => d.assetTypeId == item.assetTypeId)!;

    setCurrentRow(row);
    setParentId(row.assetTypeId);

    parentPath.splice(parentPath.indexOf(item));
    setParentPath(parentPath);
  }

  useEffectOnce(() => {
    init();
  });
  useEffect(() => {
    loadData();
    const id = financial.subscribe(() => {
      setSpecies(financial.metadata?.species);
      setFields(financial.metadata?.fields ?? []);
    });
    return () => {
      financial.unsubscribe(id);
    };
  }, [month, ready, parentId, species]);

  return (
    <div className={cls.assetLedger + ' asset-page-element'}>
      <Spin spinning={loading}>
        <div className="flex flex-col gap-2" style={{ height: '100%' }}>
          <div className="asset-page-element__topbar">
            <Breadcrumb>
              <Breadcrumb.Item className={cls.title}>
                {parentPath.length > 0 ? (
                  <a onClick={() => handleBack()}>全部资产</a>
                ) : (
                  <span>全部资产</span>
                )}
              </Breadcrumb.Item>
              {parentPath.map((p) => {
                return (
                  <Breadcrumb.Item key={p.assetTypeId}>
                    {parentId == p.assetTypeId ? (
                      <span>{p.assetTypeName}</span>
                    ) : (
                      <a onClick={() => handleBack(p)}>{p.assetTypeName}</a>
                    )}
                  </Breadcrumb.Item>
                );
              })}
            </Breadcrumb>
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
            <Table
              sticky
              pagination={false}
              bordered
              size="small"
              dataSource={data}
              scroll={{ y: 'calc(100%)' }}>
              <Table.Column
                width={320}
                title={
                  <Space>
                    <a
                      onClick={() => {
                        setCenter(
                          <OpenFileDialog
                            accepts={['分类型']}
                            rootKey={financial.space.spaceId}
                            onOk={async (files) => {
                              if (files.length > 0) {
                                const metadata = files[0].metadata as schema.XProperty;
                                financial.setSpecies(metadata);
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
                            accepts={['数值型']}
                            rootKey={financial.space.spaceId}
                            excludeIds={fields.map((f) => f.id)}
                            multiple
                            onOk={async (files) => {
                              if (files.length > 0) {
                                const items = [
                                  ...fields,
                                  ...files.map(
                                    (item) => item.metadata as schema.XProperty,
                                  ),
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
                dataIndex="assetTypeName"
                render={(_, row: AssetLedgerSummary) => {
                  if (row.isParent) {
                    return <div className="is-bold">{row.assetTypeName}</div>;
                  } else if (row.canClick) {
                    return (
                      <div
                        className="cell-link"
                        style={{ marginLeft: '8px' }}
                        onClick={() => handleExpand(row)}>
                        {row.assetTypeName}
                      </div>
                    );
                  } else {
                    return <div style={{ marginLeft: '8px' }}>{row.assetTypeName}</div>;
                  }
                }}
              />
              {fields.map((field) => (
                <Table.ColumnGroup
                  key={field.id}
                  title={
                    <Space>
                      <span>{field.name}</span>{' '}
                      <CloseCircleOutlined
                        onClick={() => {
                          financial.setFields(fields.filter((f) => f.id != field.id));
                        }}
                      />
                    </Space>
                  }>
                  {prefixMap.map((item) => {
                    const prop = item.prefix + field.id;
                    const column: ColumnType<any> = {
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
                            {formatNumber(row[prop] ?? 0, 2, true)}
                          </div>
                        );
                      };
                    } else {
                      column.render = (_, row) => {
                        return <div>{formatNumber(row[prop] ?? 0, 2, true)}</div>;
                      };
                    }
                    return <Table.Column {...column} />;
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
