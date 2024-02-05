import { useState } from 'react';
import React from 'react';
import { IWorkApply, IWorkTask } from '@/ts/core';
import FullScreenModal from '@/components/Common/fullScreen';
import Content from '@/executor/tools/task';
import GenerateThingTable from '@/executor/tools/generate/thingTable';
import CustomStore from 'devextreme/data/custom_store';
import orgCtrl from '@/ts/controller';
import { WorkTask } from '@/ts/core/work/task';

interface IProps {
  typeName: string;
  apply: IWorkApply;
}

const TaskRecord: React.FC<IProps> = ({ apply, typeName }) => {
  const [selectTask, setSelectTask] = useState<IWorkTask>();
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
        id: 'content',
        code: 'content',
        name: '内容',
        valueType: '描述型',
        remark: '内容',
        options: {
          visible: true,
        },
      },
      {
        id: 'status',
        code: 'status',
        name: '状态',
        valueType: '选择型',
        remark: '状态',
        options: {
          visible: true,
        },
        /** 字典(字典项/分类项) */
        lookups: [
          {
            id: '1',
            text: '审核中',
            value: '1',
          },
          {
            id: '100',
            text: '通过',
            value: '100',
          },
          {
            id: '200',
            text: '驳回',
            value: '200',
          },
        ],
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
    ];
  };
  const getMatch = () => {
    switch (typeName) {
      case '已办结':
        return {
          createUser: orgCtrl.user.id,
          defineId: apply?.metadata.defineId,
          status: {
            _gte_: 100,
          },
          nodeId: {
            _exists_: false,
          },
        };
      case '已发起':
        return {
          createUser: orgCtrl.user.id,
          defineId: apply?.metadata.defineId,
          status: {
            _lt_: 100,
          },
          nodeId: {
            _exists_: false,
          },
        };
    }
  };
  return (
    <>
      <GenerateThingTable
        fields={loadFields()}
        remoteOperations={true}
        filterValue={[]}
        scrolling={{
          mode: 'infinite',
          showScrollbar: 'onHover',
        }}
        onRowDblClick={(e) => {
          setSelectTask(new WorkTask(e.data, orgCtrl.work.user, true));
        }}
        dataSource={
          new CustomStore({
            key: 'id',
            async load(loadOptions) {
              let request: any = {
                ...loadOptions,
                userData: [],
                options: {
                  match: getMatch(),
                  sort: {
                    createTime: -1,
                  },
                },
              };
              const res = await orgCtrl.work.loadTasks(request);
              if (res.success && !Array.isArray(res.data)) {
                res.data = [];
              }
              return res;
            },
          })
        }
      />
      <FullScreenModal
        open={selectTask != undefined}
        centered
        width={'80vw'}
        bodyHeight={'80vh'}
        destroyOnClose
        title={'任务追踪'}
        footer={[]}
        onCancel={() => setSelectTask(undefined)}>
        {selectTask && (
          <Content
            current={selectTask}
            finished={() => {
              setSelectTask(undefined);
            }}
          />
        )}
      </FullScreenModal>
    </>
  );
};

export default TaskRecord;
