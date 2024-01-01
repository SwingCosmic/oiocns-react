import React, { useEffect, useState } from "react";
import { defineElement } from "../../defineElement";
import { ExistTypeMeta } from "../../../core/ElementMeta";
import { SEntity } from "../../../design/config/FileProp";
import { IForm } from "@/ts/core";
import { useEffectOnce } from "react-use";
import GenerateThingTable from "@/executor/tools/generate/thingTable";
import CustomStore from "devextreme/data/custom_store";
import { XThing } from "@/ts/base/schema";
import { kernel } from "@/ts/base";
import "./index.less";
import { Spin, Tag } from "antd";
import { formatDate } from "@/utils";
import { DatePicker } from "@/components/Common/StringDatePickers/DatePicker";

type DepreciationState = 'none' | 'calculated' | 'confirmed';

const stateMap: Record<DepreciationState, {label: string, type: string }> = {
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
  }
}

export default defineElement({
  render(props, ctx) {
    
    const [loading, setLoading] = useState(false);
    const [ready, setReady] = useState(false);

    const [form, setForm] = useState<IForm>(null!);
    const [detailForm, setDetailForm] = useState<IForm>(null!);
    const [creditTime, setCreditTime] = useState(formatDate(new Date(), 'yyyy-MM'));
    const [data, setData] = useState<XThing[]>([]);
 
    const [depreciationState, setDepreciationState] = useState<DepreciationState>('none');

    async function init() {
      if (!props.form?.id) {
        return;
      }

      const formData = await ctx.view.pageInfo.loadForm(props.form.id);
      setForm(formData);

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
            [`T${props.creditTimeField.id}`, '>=' , formatDate(startDate, 'yyyy/MM/dd 00:00:00')],
            [`T${props.creditTimeField.id}`, '<=' , formatDate(endDate, 'yyyy/MM/dd 23:59:59')],
          ],
        };
        const res1 = await kernel.loadThing(belongId, [belongId], loadOptions);
        console.log(loadOptions, res1.data);
        setData(res1.data);     
        
        if (res1.data.length == 0) {
          setDepreciationState('none');
          return;
        }

        const main = res1.data[0];


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
    
    return (
      <div className="asset-page-element">
        <Spin spinning={loading}>
          <div className="flex flex-col gap-2 h-full">
            <div className="asset-page-element__topbar">
              <div>资产月结账</div>
              <Tag color={stateMap[depreciationState].type}>
                {stateMap[depreciationState].label}
              </Tag>
              <div className="flex-auto"></div>
              <div>月份范围</div>
              <DatePicker
                picker="month"
                value={creditTime}
                onChange={setCreditTime}
                format="YYYY-MM"
              />
            </div>
            <div className="asset-page-element__content" style={{background: 'white'}}>
              <div style={{height: '100%'}}>
                {form ? <GenerateThingTable
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
                /> : <></>}                
              </div>
            </div>
          </div> 
        </Spin>
      </div>
    );
  },
  displayName: 'AssetInitialization',
  meta: {
    label: '资产初始化',
    type: 'Element',
    props: {
      form: {
        type: 'type',
        label: '单位信息表单',
        typeName: 'formFile',
        required: true,
      } as ExistTypeMeta<SEntity>,
      creditTimeField: {
        type: 'type',
        label: '业务时间字段',
        typeName: 'propertyFile',
        editorConfig: {
          propType: '日期型',
        },
        required: true,
      } as ExistTypeMeta<SEntity>,
    },
  }
});