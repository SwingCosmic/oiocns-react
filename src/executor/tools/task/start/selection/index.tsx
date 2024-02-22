import FullScreenModal from '@/components/Common/fullScreen';
import { IForm, IWork, IWorkApply } from '@/ts/core';
import { Badge, Button, Empty, Tabs } from 'antd';
import CustomStore from 'devextreme/data/custom_store';
import React, { useEffect, useRef, useState } from 'react';
import GenerateThingTable from '../../../generate/thingTable';
import { Command, schema } from '@/ts/base';
import { generateUuid } from '@/utils/excel';
import { formatDate } from '@/ts/base/common';
import DefaultWayStart from '../default';

interface IProps {
  work: IWork;
  apply: IWorkApply;
  finished?: () => void;
}

const WorkSelection: React.FC<IProps> = ({ apply, work, finished }) => {
  const [selected, setSelected] = useState(false);
  const [command] = useState(new Command());
  useEffect(() => {
    const id = command.subscribe((type, cmd, args) => {
      if (type == 'select' && cmd == 'insert') {
        const { form, data } = args;
        if (apply.instanceData.node) {
          apply.instanceData.data[form.id] = [
            {
              before: [],
              after: data,
              nodeId: apply.instanceData.node.id,
              rules: [],
              formName: form.name,
              creator: apply.belong.userId,
              createTime: formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss.S'),
            },
          ];
        }
      }
    });
    return () => {
      return command.unsubscribe(id);
    };
  }, []);
  const loadTitle = () => {
    if (selected) {
      return '发起办事';
    }
    return '数据选择';
  };
  const loadCenter = () => {
    if (!apply.instanceData.node) {
      return <Empty></Empty>;
    }
    if (selected) {
      return <DefaultWayStart apply={apply} work={work} finished={finished} />;
    }
    const allForms = apply.detailForms.flatMap((item) => [
      { form: item, type: '原始' },
      { form: item.storage.form, type: '暂存' },
    ]);
    return (
      <Tabs
        tabBarExtraContent={
          <Button type="primary" ghost onClick={() => setSelected(true)}>
            发起办事
          </Button>
        }
        items={allForms.map((formType) => {
          return {
            key: formType.form.key + formType.type,
            label: <Label {...formType} command={command} />,
            children: <Table {...formType} command={command} />,
          };
        })}
      />
    );
  };
  return (
    <FullScreenModal
      open
      title={loadTitle()}
      onOk={() => finished?.()}
      onCancel={() => finished?.()}
      fullScreen
      destroyOnClose
      cancelText={'关闭'}
      width={'80vw'}
      bodyHeight={'70vh'}>
      {loadCenter()}
    </FullScreenModal>
  );
};

interface FormType {
  form: IForm;
  type: string;
  command: Command;
}

const Label: React.FC<FormType> = ({ form, type, command }) => {
  const [count, setCount] = useState(0);
  const [selectedCount, setSelectedCount] = useState(0);
  useEffect(() => {
    form.storage.count().then((count) => setCount(count));
    const id = form.storage.command.subscribe(async (sendType, cmd) => {
      if (sendType == type && cmd == form.storage.key) {
        setCount(await form.storage.count());
      }
    });
    const sId = command.subscribe((type, cmd, args) => {
      if (type == 'select' && cmd == 'insert') {
        setSelectedCount(args.data.length);
      }
    });
    return () => {
      form.storage.command.unsubscribe(id);
      command.unsubscribe(sId);
    };
  }, []);
  if (type == '原始') {
    return form.name;
  }
  return (
    <Badge count={count}>
      {`（已选择 ${selectedCount} 条）`}
      {form.name}
      {type == '暂存' && '（暂存）'}
    </Badge>
  );
};

const Table: React.FC<FormType> = ({ form, type, command }) => {
  const [key, setKey] = useState(generateUuid());
  const selected = useRef<schema.XThing[]>([]);
  useEffect(() => {
    const id = form.storage.command.subscribe((sendType, cmd) => {
      if (sendType == type && cmd == form.storage.key) {
        setKey(generateUuid());
      }
    });
    return () => {
      form.storage.command.unsubscribe(id);
    };
  }, []);
  return (
    <GenerateThingTable
      key={key}
      fields={form.fields}
      height={'80vh'}
      selection={{
        mode: 'multiple',
        allowSelectAll: true,
        selectAllMode: 'page',
        showCheckBoxesMode: 'always',
      }}
      toolbar={{
        visible: true,
        items: [
          {
            name: 'putIn',
            location: 'after',
            widget: 'dxButton',
            visible: type == '原始',
            options: {
              text: '放入暂存箱',
              onClick: () => {
                form.storage.create(selected.current);
              },
            },
          },
          {
            name: 'takeOut',
            location: 'after',
            widget: 'dxButton',
            visible: type == '暂存',
            options: {
              text: '拿出暂存箱',
              onClick: async () => {
                let current = selected.current;
                selected.current = [];
                await form.storage.remove(current);
                command.emitter('select', 'insert', {
                  form: form,
                  data: await form.storage.genInstanceData(selected.current),
                });
              },
            },
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
      onSelectionChanged={async (e) => {
        selected.current = e.selectedRowsData;
        if (type == '暂存') {
          command.emitter('select', 'insert', {
            form: form,
            data: await form.storage.genInstanceData(selected.current),
          });
        }
      }}
      filterValue={JSON.parse(form.metadata.options?.workDataRange?.filterExp ?? '[]')}
      dataSource={
        new CustomStore({
          key: 'id',
          async load(loadOptions) {
            loadOptions.userData = [];
            let request: any = { ...loadOptions };
            if (type == '原始') {
              return form.loadThing(request);
            } else if (type == '暂存') {
              return form.storage.loadThing(request);
            }
          },
        })
      }
      remoteOperations={true}
    />
  );
};

export default WorkSelection;
