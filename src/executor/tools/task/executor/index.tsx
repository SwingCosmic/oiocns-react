import { model } from '@/ts/base';
import { Controller } from '@/ts/controller';
import { IWorkTask } from '@/ts/core';
import { IExecutor } from '@/ts/core/work/executor';
import { getNodeByNodeId } from '@/utils/tools';
import { Button, Progress, Space, Table, Tag } from 'antd';
import React, { useEffect, useState } from 'react';

interface IProps {
  current: IWorkTask;
  nodeId: string;
  trigger: string;
  formData: Map<string, model.FormEditData>;
  command: Controller;
}

export const Executors: React.FC<IProps> = (props) => {
  const node = getNodeByNodeId(props.nodeId, props.current.instanceData!.node);
  const executors: IExecutor[] = node ? props.current.loadExecutors(node) : [];
  return (
    <Space
      style={{ paddingLeft: 20, paddingTop: 10, width: '100%' }}
      direction="vertical">
      {executors
        .filter((item) => item.metadata.trigger == props.trigger)
        .filter((item) => ['数据申领', 'Webhook'].includes(item.metadata.funcName))
        .map((item, index) => {
          switch (item.metadata.funcName) {
            case '数据申领':
              return (
                <AcquireExecutor
                  current={item}
                  index={index}
                  formData={props.formData}
                  command={props.command}
                />
              );
            default:
              return (
                <DefaultExecutor
                  index={index}
                  current={item}
                  formData={props.formData}
                  command={props.command}
                />
              );
          }
        })}
    </Space>
  );
};

interface ExecutorProps {
  index: number;
  current: IExecutor;
  formData: Map<string, model.FormEditData>;
  command: Controller;
}

const AcquireExecutor: React.FC<ExecutorProps> = (props) => {
  const [loading, setLoading] = useState(false);
  const acquires = props.current.metadata.acquires ?? [];
  return (
    <div style={{ textAlign: 'right' }}>
      <Button
        type="primary"
        size="small"
        ghost
        loading={loading}
        onClick={async () => {
          setLoading(true);
          await props.current.execute(props.formData);
          props.command.changCallback();
          setLoading(false);
        }}>
        批量执行
      </Button>
      <Table<model.Acquire>
        rowKey={'id'}
        style={{ marginTop: 8 }}
        size="small"
        dataSource={acquires.filter((item) => item.enable)}
        pagination={false}
        columns={[
          { key: 'typeName', title: '类型', dataIndex: 'typeName', width: 300 },
          { key: 'code', title: '编码', dataIndex: 'code', width: 300 },
          { key: 'name', title: '名称', dataIndex: 'name', width: 300 },
          {
            key: 'progress',
            title: '进度',
            render: () => {
              return <Progress percent={0} />;
            },
          },
          {
            key: 'action',
            title: '操作',
            align: 'center',
            render: () => {
              return (
                <Button type="primary" size="small" ghost>
                  执行
                </Button>
              );
            },
          },
        ]}
      />
    </div>
  );
};

const DefaultExecutor: React.FC<ExecutorProps> = (props) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(props.current.progress);
  useEffect(() => {
    const id = props.current.command.subscribe(() => setProgress(props.current.progress));
    return () => props.current.command.unsubscribe(id);
  }, []);
  return (
    <div style={{ display: 'flex', justifyContent: 'space-around' }} key={props.index}>
      <Tag>{props.current.metadata.funcName}</Tag>
      <Progress style={{ flex: 1, marginRight: 10 }} percent={progress} />
      <Button
        size="small"
        loading={loading}
        type="primary"
        onClick={async () => {
          setLoading(true);
          await props.current.execute(props.formData);
          props.command.changCallback();
          setLoading(false);
        }}>
        执行
      </Button>
    </div>
  );
};
