import { DatePicker } from '@/components/Common/StringDatePickers/DatePicker';
import GenerateThingTable from '@/executor/tools/generate/thingTable';
import { XThing } from '@/ts/base/schema';
import { IFinancial, IForm } from '@/ts/core';
import { formatDate } from '@/utils';
import { Result, Spin, Tag } from 'antd';
import CustomStore from 'devextreme/data/custom_store';
import React, { useEffect, useState } from 'react';
import './index.less';
import { IPeriod } from '@/ts/core/work/financial/period';
import moment from 'moment';

type DepreciationState = 'none' | 'calculated' | 'confirmed';

const stateMap: Record<DepreciationState, { label: string; type: string }> = {
  none: {
    label: '未计提',
    type: 'error',
  },
  calculated: {
    label: '已计提',
    type: 'processing',
  },
  confirmed: {
    label: '已确认',
    type: 'success',
  },
};

interface IProps {
  financial: IFinancial;
  period: IPeriod;
}

const Depreciation: React.FC<IProps> = ({ financial, period }) => {
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  const [form, setForm] = useState<IForm>(null!);
  const [detailForm, setDetailForm] = useState<IForm>(null!);
  const [creditTime, setCreditTime] = useState(formatDate(new Date(), 'yyyy-MM'));
  const [data, setData] = useState<XThing[]>([]);
  const [detailData, setDetailData] = useState<XThing[]>([]);
  const [depreciationState, setDepreciationState] = useState<DepreciationState>('none');

  async function loadData() {
    try {
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [creditTime, ready]);

  if (errMsg) {
    return (
      <div className="asset-page-element">
        <Result status="error" title={errMsg} style={{ height: '100%' }} />
      </div>
    );
  }

  return (
    <div className="asset-page-element">
      <Spin spinning={loading}>
        <div className="flex flex-col gap-2 h-full">
          <div className="asset-page-element__topbar">
            <div>资产折旧摊销</div>
            <Tag color={stateMap[depreciationState].type}>
              {stateMap[depreciationState].label}
            </Tag>
            <div className="flex-auto"></div>
            <div>业务月份</div>
            <DatePicker
              picker="month"
              value={period.period}
              onChange={setCreditTime}
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
          <div className="asset-page-element__content" style={{ background: 'white' }}>
            <div style={{ height: '50%' }}>
              {form ? (
                <GenerateThingTable
                  fields={form.fields}
                  height={'calc(100%)'}
                  dataIndex="attribute"
                  dataSource={
                    new CustomStore({
                      key: 'id',
                      async load(_) {
                        return data;
                      },
                    })
                  }
                />
              ) : (
                <></>
              )}
            </div>

            <div style={{ height: '50%' }}>
              {detailForm ? (
                <GenerateThingTable
                  fields={detailForm.fields}
                  height={'calc(100%)'}
                  dataIndex="attribute"
                  dataSource={
                    new CustomStore({
                      key: 'id',
                      async load(_) {
                        return detailData;
                      },
                    })
                  }
                />
              ) : (
                <></>
              )}
            </div>
          </div>
        </div>
      </Spin>
    </div>
  );
};

export default Depreciation;
