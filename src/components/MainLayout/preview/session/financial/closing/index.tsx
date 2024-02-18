import { DatePicker } from '@/components/Common/StringDatePickers/DatePicker';
import { IFinancial } from '@/ts/core';
import { IPeriod } from '@/ts/core/work/financial/period';
import { Button, Tag } from 'antd';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { useEffectOnce } from 'react-use';
import './index.less';
import { ClosingTemplate } from './template';

interface IProps {
  financial: IFinancial;
  current: IPeriod;
}

export const Closing: React.FC<IProps> = ({ financial, current }) => {
  const [loading, setLoading] = useState(false);

  const [period, setPeriod] = useState(current);
  const [closed, setClosed] = useState(current.closed);
  const [center, setCenter] = useState(<></>);

  async function init() {}

  async function loadData() {}

  useEffectOnce(() => {
    init();
  });
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
              loading={loading}
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
          </div>
        </div>
      </div>
      {center}
    </>
  );
};
