import { DatePicker } from '@/components/Common/StringDatePickers/DatePicker';
import { XClosing } from '@/ts/base/schema';
import { IFinancial } from '@/ts/core';
import { IPeriod } from '@/ts/core/work/financial/period';
import { Button, Table, Tag } from 'antd';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import '../index.less';
import { ClosingTemplate } from './template';
import { formatNumber } from '@/utils';

interface IProps {
  financial: IFinancial;
  current: IPeriod;
}

export const Closing: React.FC<IProps> = ({ financial, current }) => {
  const [period, setPeriod] = useState(current);
  const [closed, setClosed] = useState(current.closed);
  const [center, setCenter] = useState(<></>);
  const [data, setData] = useState(current.closings);

  async function loadData() {
    setData(await current.loadClosings());
    await current.closingSummary();
  }

  useEffect(() => {
    loadData();
  }, [period]);

  return (
    <>
      <div className="asset-page-element">
        <div className="flex flex-col gap-2 h-full">
          <div className="asset-page-element__topbar">
            <div>资产月结账</div>
            <Tag color={closed ? 'green' : 'red'}>{closed ? '已结账' : '未结账'}</Tag>
            <div className="flex-auto"></div>
            <Button
              onClick={() =>
                setCenter(
                  <ClosingTemplate
                    financial={financial}
                    onFinished={() => setCenter(<></>)}
                    onCancel={() => setCenter(<></>)}
                  />,
                )
              }>
              月结模板配置
            </Button>
            <Button
              onClick={() =>
                setCenter(
                  <ClosingTemplate
                    financial={financial}
                    onFinished={() => setCenter(<></>)}
                    onCancel={() => setCenter(<></>)}
                  />,
                )
              }>
              试算平衡
            </Button>
            <div>期间</div>
            <DatePicker
              picker="month"
              value={period.period}
              onChange={(value) => {
                for (const item of financial.periods) {
                  if (item.period == value) {
                    setPeriod(item);
                    setClosed(item.closed);
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
            <Button onClick={() => loadData()}>刷新</Button>
          </div>
          <Table<XClosing>
            rowKey={'id'}
            sticky
            columns={[
              {
                title: '会计科目代码',
                dataIndex: 'code',
              },
              {
                title: '会计科目名称',
                dataIndex: 'name',
              },
              {
                title: '期初值',
                align: 'right',
                children: [
                  {
                    title: '资产账',
                    dataIndex: 'assetStartAmount',
                    align: 'right',
                    render: (_, row) => {
                      return formatNumber(row.assetStartAmount ?? 0, 2, true);
                    },
                  },
                ],
              },
              {
                title: '本期增加',
                align: 'right',
                dataIndex: 'assetStartAmount',
                render: (_, row) => {
                  return formatNumber(row.assetStartAmount ?? 0, 2, true);
                },
              },
              {
                title: '本期减少',
                align: 'right',
                dataIndex: 'assetSubAmount',
                render: (_, row) => {
                  return formatNumber(row.assetSubAmount ?? 0, 2, true);
                },
              },
              {
                title: '期末值',
                children: [
                  {
                    title: '资产账',
                    dataIndex: 'assetEndAmount',
                    align: 'right',
                    render: (_, row) => {
                      return formatNumber(row.assetEndAmount ?? 0, 2, true);
                    },
                  },
                  {
                    title: '财务账',
                    dataIndex: 'financialAmount',
                    align: 'right',
                    render: (_, row) => {
                      return formatNumber(row.financialAmount ?? 0, 2, true);
                    },
                  },
                ],
              },
              {
                title: '对账状态',
                align: 'center',
                dataIndex: 'balanced',
                render: (value) => {
                  return value ? (
                    <Tag color="green">已平</Tag>
                  ) : (
                    <Tag color="red">未平</Tag>
                  );
                },
              },
            ]}
            pagination={false}
            bordered
            size="small"
            dataSource={data}
            scroll={{ y: 'calc(100%)' }}
          />
        </div>
      </div>
      {center}
    </>
  );
};
