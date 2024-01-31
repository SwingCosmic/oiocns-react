import { DatePicker } from '@/components/Common/StringDatePickers/DatePicker';
import GenerateThingTable from '@/executor/tools/generate/thingTable';
import { kernel } from '@/ts/base';
import { XThing } from '@/ts/base/schema';
import { IBelong, IFinancial, IForm } from '@/ts/core';
import { formatDate } from '@/utils';
import { Result, Spin, Tag } from 'antd';
import CustomStore from 'devextreme/data/custom_store';
import React, { useEffect, useState } from 'react';
import { useEffectOnce } from 'react-use';
import './index.less';

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
}

const AssetDepreciation: React.FC<IProps> = ({ financial }) => {
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  const [form, setForm] = useState<IForm>(null!);
  const [detailForm, setDetailForm] = useState<IForm>(null!);
  const [creditTime, setCreditTime] = useState(formatDate(new Date(), 'yyyy-MM'));
  const [data, setData] = useState<XThing[]>([]);
  const [detailData, setDetailData] = useState<XThing[]>([]);
  const [depreciationState, setDepreciationState] = useState<DepreciationState>('none');

  function getCompany() {
    return ctx.view.pageInfo.directory.target.space as IBelong;
  }

  async function init() {
    if (!props.form?.id) {
      return;
    }
    if (!props.detailForm?.id) {
      return;
    }

    const belong = getCompany();
    let period = belong.financial.metadata?.initialized!;
    setCreditTime(() => period);
    if (!period) {
      setErrMsg('当前单位未初始化账期');
      return;
    }

    const formData = await ctx.view.pageInfo.loadForm(props.form.id);
    setForm(formData);

    const detailFormData = await ctx.view.pageInfo.loadForm(props.detailForm.id);
    setDetailForm(detailFormData);

    setReady(true);
  }

  async function loadData() {
    if (!ready) {
      return;
    }

    try {
      setLoading(true);

      const belongId = ctx.view.pageInfo.directory.belongId;

      const startDate = new Date(creditTime + '-01 00:00:00');
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);

      const loadOptions = {
        take: 100,
        skip: 0,
        requireTotalCount: true,
        userData: [`F${props.form.id}`],
        filter: [
          // ['belongId', '=', belongId],
          [
            `T${props.creditTimeField.id}`,
            '>=',
            formatDate(startDate, 'yyyy/MM/dd 00:00:00'),
          ],
          [
            `T${props.creditTimeField.id}`,
            '<=',
            formatDate(endDate, 'yyyy/MM/dd 23:59:59'),
          ],
        ],
      };
      const res1 = await kernel.loadThing(belongId, [belongId], loadOptions);
      console.log(loadOptions, res1.data);
      setData(res1.data);

      if (res1.data.length == 0) {
        setDepreciationState('none');
        setDetailData([]);
        return;
      }

      const res2 = await kernel.loadThing(belongId, [belongId], {
        take: 100,
        skip: 0,
        requireTotalCount: true,
        userData: [`F${props.detailForm.id}`],
        filter: [
          // ['belongId', '=', belongId],
          [
            `T${props.creditTimeField.id}`,
            '>=',
            formatDate(startDate, 'yyyy/MM/dd 00:00:00'),
          ],
          [
            `T${props.creditTimeField.id}`,
            '<=',
            formatDate(endDate, 'yyyy/MM/dd 23:59:59'),
          ],
        ],
      });

      setDetailData(res2.data);
      if (res2.data.length == 0) {
        setDepreciationState('none');
      } else {
        setDepreciationState('calculated');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffectOnce(() => {
    init();
  });
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
              value={creditTime}
              onChange={setCreditTime}
              format="YYYY-MM"
              disabledDate={(date) => {
                return (
                  date.toDate().getTime() <
                  new Date(getCompany().financial.metadata?.current!).getTime()
                );
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

export default AssetDepreciation;