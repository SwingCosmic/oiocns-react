import { IForm, IWork } from '@/ts/core';
import { Button, Divider, Empty, Space, Spin, Tabs } from 'antd';
import CustomStore from 'devextreme/data/custom_store';
import React, { useEffect, useRef, useState } from 'react';
import GenerateThingTable from '../../generate/thingTable';
import FullScreenModal from '@/components/Common/fullScreen';
import TaskStart from '../start';
import { model, schema } from '@/ts/base';
import orgCtrl from '@/ts/controller';
import { formatDate } from '@/utils';
import { generateUuid } from '@/utils/excel';

interface IProps {
  current: IWork;
  finished?: () => void;
}

const WorkSelection: React.FC<IProps> = ({ current, finished }) => {
  const [key, setKey] = useState(generateUuid());
  const [loaded, setLoaded] = useState(false);
  const [forms, setForms] = useState<IForm[]>([]);
  const [selected, setSelected] = useState(false);
  const selectedData = useRef<{ [id: string]: schema.XThing[] }>({});
  useEffect(() => {
    current.loadNode().then(() => {
      setLoaded(true);
      setForms(current.primaryForms);
    });
  }, [forms]);
  const loadTitle = () => {
    if (selected) {
      return <span>发起流程</span>;
    }
    return <span>数据选择</span>;
  };
  const loadCenter = () => {
    if (!loaded) {
      return (
        <Spin tip={'配置信息加载中...'}>
          <div style={{ width: '100%', height: '100%' }}></div>
        </Spin>
      );
    }
    if (!current.node) {
      return <Empty></Empty>;
    }
    if (selected) {
      const instance: model.InstanceDataModel = {
        data: {},
        node: current.node,
        fields: {},
        primary: {},
        rules: [],
      };
      for (const form of forms) {
        instance.fields[form.id] = form.fields;
        instance.data[form.id] = [
          {
            nodeId: current.node.id,
            formName: form.name,
            before: [],
            after: selectedData.current[form.id] ?? [],
            creator: orgCtrl.user.id,
            createTime: formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss.S'),
            rules: [],
          },
        ];
      }
      return <TaskStart current={current} finished={finished} data={instance} />;
    }
    return (
      <Tabs
        items={forms.map((form) => {
          return {
            key: form.key,
            label: form.name,
            children: (
              <GenerateThingTable
                key={form.key}
                fields={form.fields}
                height={'60vh'}
                selection={{
                  mode: 'single',
                }}
                onSelectionChanged={(e) => {
                  selectedData.current[form.id] = e.selectedRowsData;
                }}
                filterValue={JSON.parse(form.metadata.searchRule ?? '[]')}
                dataSource={
                  new CustomStore({
                    key: 'id',
                    async load(loadOptions) {
                      loadOptions.userData = [];
                      let request: any = { ...loadOptions };
                      return form.loadThing(request);
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
  const loadFooter = () => {
    if (selected) {
      return <></>;
    }
    return (
      <Space split={<Divider type="vertical" />} wrap size={2}>
        <Button
          type="primary"
          onClick={() => {
            setSelected(true);
            setKey(generateUuid());
          }}>
          确认
        </Button>
      </Space>
    );
  };
  return (
    <FullScreenModal
      key={key}
      open
      title={loadTitle()}
      onOk={() => finished?.()}
      onCancel={() => finished?.()}
      fullScreen={selected}
      destroyOnClose
      cancelText={'关闭'}
      width={'80vw'}
      bodyHeight={'70vh'}
      footer={loadFooter()}>
      {loadCenter()}
    </FullScreenModal>
  );
};

export default WorkSelection;
