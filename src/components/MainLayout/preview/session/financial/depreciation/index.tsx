import { DatePicker } from '@/components/Common/StringDatePickers/DatePicker';
import { common, schema } from '@/ts/base';
import { Node } from '@/ts/base/common';
import { IFinancial } from '@/ts/core';
import { IPeriod, Operation, OperationStatus } from '@/ts/core/work/financial/period';
import { SumItem } from '@/ts/core/work/financial/summary';
import { formatNumber } from '@/utils';
import { Button, Progress, Table, Tag } from 'antd';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { DepreciationTemplate } from './template';

interface IProps {
  financial: IFinancial;
  current: IPeriod;
  config: schema.XConfiguration;
}

const Depreciation: React.FC<IProps> = ({ financial, current, config }) => {
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState(current);
  const [depreciated, setDepreciated] = useState(current.deprecated);
  const [data, setData] = useState<common.Tree<SumItem> | undefined>();
  const [progress, setProgress] = useState(0);
  const [center, setCenter] = useState(<></>);
  const [operating, setOperating] = useState(false);

  const wrapper = async (operation: Operation) => {
    setLoading(true);
    setOperating(true);
    setProgress(0);
    try {
      await period.depreciation(operation);
      await loadingOperation();
    } finally {
      setOperating(false);
      setLoading(false);
    }
  };

  const loadingOperation = async () => {
    while (true) {
      const log = await period.loadOperationLog();
      await common.sleep(500);
      if (log) {
        setProgress(log.progress);
        if (log.status == OperationStatus.Completed) {
          switch (log.typeName) {
            case 'Confirm':
            case 'Revoke':
              await period.loadMetadata();
              setDepreciated(period.deprecated);
              break;
          }
          setData(await period.depreciationSummary(config.dimensions[0]));
          break;
        }
      } else {
        throw new Error('操作日志加载失败');
      }
    }
  };

  const init = async () => {
    setData(await period.depreciationSummary(config.dimensions[0]));
    const log = await period.loadOperationLog();
    if (log) {
      switch (log.status) {
        case OperationStatus.Working:
          await loadingOperation();
          break;
      }
    } else {
      if (!period.deprecated) {
        wrapper('Calculate');
      }
    }
  };

  useEffect(() => {
    init();
    const id = period.financial.subscribe(() => {
      setDepreciated(period.deprecated);
      loadingOperation();
    });
    return () => {
      period.financial.unsubscribe(id);
    };
  }, [period]);

  return (
    <>
      <div className="asset-page-element">
        <div className="flex flex-col gap-2 h-full">
          <div className="asset-page-element__topbar">
            <div>资产折旧摊销</div>
            <Tag color={depreciated ? 'green' : 'red'}>
              {depreciated ? '已计提' : '未计提'}
            </Tag>
            {operating && <Progress percent={progress} style={{ width: 200 }} />}
            <div className="flex-auto"></div>
            <Button
              loading={loading}
              onClick={() =>
                setCenter(
                  <DepreciationTemplate
                    financial={financial}
                    onFinished={() => setCenter(<></>)}
                    onCancel={() => setCenter(<></>)}
                  />,
                )
              }>
              折旧模板配置
            </Button>
            {!period.deprecated && (
              <Button loading={loading} onClick={() => wrapper('Calculate')}>
                计算
              </Button>
            )}
            {!period.deprecated && (
              <Button loading={loading} onClick={() => wrapper('Confirm')}>
                确认
              </Button>
            )}
            {period.deprecated && period.period == period.financial.current && (
              <Button loading={loading} onClick={() => wrapper('Revoke')}>
                取消折旧
              </Button>
            )}
            <div>期间</div>
            <DatePicker
              picker="month"
              value={current.period}
              onChange={(value) => {
                for (const item of financial.periods) {
                  if (item.period == value) {
                    setPeriod(item);
                    setDepreciated(item.deprecated);
                    break;
                  }
                }
              }}
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
          </div>
          <Table<Node<SumItem>>
            loading={loading}
            rowKey={'id'}
            sticky
            columns={[
              {
                title: config.dimensions[0].name,
                dataIndex: 'name',
                render: (_, row) => {
                  return row.data.name;
                },
              },
              {
                title: '本月计提折旧',
                align: 'right',
                render: (_, row) => {
                  return formatNumber(row.data['current-root-change'] ?? 0, 2, true);
                },
              },
              {
                title: '本月增加折旧',
                align: 'right',
                render: (_, row) => {
                  return formatNumber(row.data['plus-root-change'] ?? 0, 2, true);
                },
              },
              {
                title: '本月减少折旧',
                align: 'right',
                render: (_, row) => {
                  return formatNumber(row.data['minus-root-change'] ?? 0, 2, true);
                },
              },
              {
                title: '合计',
                align: 'right',
                render: (_, row) => {
                  const result =
                    +(row.data['current-root-change'] ?? 0) +
                    +(row.data['plus-root-change'] ?? 0) -
                    +(row.data['minus-root-change'] ?? 0);
                  return formatNumber(result ?? 0, 2, true);
                },
              },
            ]}
            pagination={false}
            bordered
            size="small"
            dataSource={data?.root.children || []}
            scroll={{ y: 'calc(100%)' }}
          />
        </div>
      </div>
      {center}
    </>
  );
};

export default Depreciation;
