import GenerateThingTable from '@/executor/tools/generate/thingTable';
import { model } from '@/ts/base';
import { ITransfer, IForm } from '@/ts/core';
import { Tabs } from 'antd';
import CustomStore from 'devextreme/data/custom_store';
import React, { useState, useEffect } from 'react';

interface IProps {
  transfer: ITransfer;
  current: model.Store;
}

const loadFields = async (transfer: ITransfer, current: model.Store) => {
  const map: { [key: string]: IForm } = {};
  for (const app of await transfer.directory.target.directory.loadAllApplication()) {
    const works = await app.loadWorks();
    const work = works.find((item) => item.id == current.workId);
    if (work) {
      await work.loadWorkNode();
      const forms = [...work.primaryForms, ...work.detailForms];
      for (const form of forms) {
        await form.loadContent();
        map[form.id] = form;
      }
    }
  }
  return map;
};

const DataTables: React.FC<IProps> = ({ transfer, current }) => {
  const [curTab, setCurTab] = useState<string>();
  const [fieldsMap, setFieldsMap] = useState<{ [key: string]: IForm }>({});
  const [notInit, setNotInit] = useState<boolean>(true);
  useEffect(() => {
    if (notInit) {
      loadFields(transfer, current).then((res) => {
        setFieldsMap(res);
        setNotInit(false);
      });
    }
  });
  return (
    <Tabs
      activeKey={curTab}
      onChange={setCurTab}
      items={Object.keys(fieldsMap).map((key) => {
        const form = fieldsMap[key];
        const data = transfer.curTask?.visitedNodes.get(current.id)?.data;
        return {
          key: key,
          label: form?.name,
          children: (
            <GenerateThingTable
              fields={form.fields}
              height={'70vh'}
              selection={{
                mode: 'multiple',
                allowSelectAll: true,
                selectAllMode: 'page',
                showCheckBoxesMode: 'always',
              }}
              dataIndex="attribute"
              dataSource={
                new CustomStore({
                  key: 'Id',
                  async load(_) {
                    return {
                      data: data[key] ?? [],
                      totalCount: data[key]?.length ?? 0,
                    };
                  },
                })
              }
              remoteOperations={true}
            />
          ),
        };
      })}
    />
  );
};

export { DataTables };
