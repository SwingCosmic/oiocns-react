import { DatePicker } from '@/components/Common/StringDatePickers/DatePicker';
import { common, schema } from '@/ts/base';
import { Node } from '@/ts/base/common';
import { IFinancial } from '@/ts/core';
import { IPeriod, Operation, OperationStatus } from '@/ts/core/work/financial/period';
import { SumItem } from '@/ts/core/work/financial/summary';
import { formatDate, formatNumber } from '@/utils';
import { Button, Progress, Table, Tag } from 'antd';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { DepreciationTemplate } from './template';

interface IProps {
  financial: IFinancial;
  period: IPeriod;
  config: schema.XDepreciationConfig;
}

const Depreciation: React.FC<IProps> = ({ financial, period, config }) => {
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(formatDate(new Date(), 'yyyy-MM'));
  const [operation, setOperation] = useState<schema.XOperationLog>();
  const [depreciated, setDepreciated] = useState(period.deprecated);
  const [data, setData] = useState<common.Tree<SumItem> | undefined>();
  const [progress, setProgress] = useState(0);
  const [center, setCenter] = useState(<></>);
  const [operating, setOperating] = useState(false);

  const wrapper = async (operation: Operation) => {
    setLoading(true);
    setOperating(true);
    setProgress(0);
    try {
      await depreciation(operation, (p) => setProgress(p));
      setData(await period.depreciationSummary(config.dimensions[0]));
    } finally {
      setOperating(false);
      setLoading(false);
    }
  };

  const depreciation = async (operation: Operation, onProgress: (p: number) => void) => {
    await period.depreciation(operation);
    while (true) {
      const log = await period.loadOperationLog();
      await common.sleep(500);
      if (log) {
        onProgress(log.progress);
        if (log.status == OperationStatus.Completed) {
          break;
        }
      }
    }
  };

  useEffect(() => {
    wrapper('Calculate');
  }, [current]);

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
            {!period.deprecated && (
              <Button loading={loading} onClick={() => wrapper('Revoke')}>
                取消折旧
              </Button>
            )}
            <div>期间</div>
            <DatePicker
              picker="month"
              value={period.period}
              onChange={setCurrent}
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
                  return row.data['plus-T' + config.accumulatedDepreciation.id];
                },
              },
              {
                title: '本月减少折旧',
                align: 'right',
                render: (_, row) => {
                  return row.data['plus-T' + config.accumulatedDepreciation.id];
                },
              },
              {
                title: '合计',
                align: 'right',
                render: (_, row) => {
                  return row.data['plus-T' + config.accumulatedDepreciation.id];
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
