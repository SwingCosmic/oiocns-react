import React, { useState } from 'react';
import { IWorkApply } from '@/ts/core';
import { model, schema } from '@/ts/base';
import orgCtrl from '@/ts/controller';
import GenerateThingTable from '@/executor/tools/generate/thingTable';
import { AiFillRest } from 'react-icons/ai';
import useObjectUpdate from '@/hooks/useObjectUpdate';
import CustomStore from 'devextreme/data/custom_store';

interface IProps {
  apply: IWorkApply;
  onShow: (instance: schema.XWorkInstance) => void;
}

/** 多tab表格 */
const WorkStagging: React.FC<IProps> = ({ onShow, apply }) => {
  const [key, forceUpdate] = useObjectUpdate(apply);
  const [selectStaggings, setSelectStaggings] = useState<schema.XWorkInstance[]>([]);
  const loadMenus = () => {
    return {
      items: [
        {
          key: 'remove',
          label: '移除',
          icon: <AiFillRest fontSize={22} />,
        },
      ],
      onMenuClick: async (_: string, data: any) => {
        const success = await orgCtrl.user.workStagging.remove(data);
        if (success) {
          forceUpdate();
        }
      },
    };
  };
  const loadFields = () => {
    return [
      {
        id: 'title',
        code: 'title',
        name: '标题',
        valueType: '描述型',
        remark: '标题',
        options: {
          visible: true,
        },
      },
      {
        id: 'remark',
        code: 'remark',
        name: '备注',
        valueType: '描述型',
        remark: '备注',
        options: {
          visible: true,
        },
      },
    ] as model.FieldModel[];
  };
  return (
    <GenerateThingTable
      key={key}
      fields={loadFields()}
      pager={{ visible: false }}
      remoteOperations={true}
      filterValue={[]}
      dataMenus={loadMenus()}
      onSelectionChanged={(e) => {
        setSelectStaggings(e.selectedRowsData);
      }}
      selection={{
        mode: 'multiple',
        allowSelectAll: true,
        selectAllMode: 'page',
        showCheckBoxesMode: 'always',
      }}
      scrolling={{
        mode: 'infinite',
        showScrollbar: 'onHover',
      }}
      onRowDblClick={(e) => {
        onShow.apply(this, [e.data]);
      }}
      dataSource={
        new CustomStore({
          key: 'id',
          async load(loadOptions) {
            let request: any = {
              ...loadOptions,
              userData: [],
              options: {
                match: {
                  defineId: apply.metadata.defineId,
                },
                sort: {
                  createTime: -1,
                },
              },
            };
            const res = await orgCtrl.user.workStagging.loadResult(request);
            if (res.success && !Array.isArray(res.data)) {
              res.data = [];
            }
            return res;
          },
        })
      }
      toolbar={{
        visible: true,
        items: [
          {
            name: 'remove',
            location: 'after',
            widget: 'dxButton',
            options: {
              text: '移除',
              icon: 'remove',
              onClick: () => {
                orgCtrl.user.workStagging.removeMany(selectStaggings);
                forceUpdate();
              },
            },
            visible: selectStaggings.length > 0,
          },
          {
            name: 'columnChooserButton',
            location: 'after',
          },
          {
            name: 'searchPanel',
            location: 'after',
          },
        ],
      }}
    />
  );
};

export default WorkStagging;
