import { IWork, IWorkTask } from '@/ts/core';
import { Empty, Spin } from 'antd';
import React from 'react';
import { model } from '@/ts/base';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import DefaultWayStart from './default';
import MultitabTable from './multitabTable';
import WorkSelect from '@/executor/tools/task/start/selection';
import BelongFinancial from '@/components/MainLayout/preview/session/financial';

// 卡片渲染
interface IProps {
  current: IWork | IWorkTask;
  finished?: () => void;
  data?: model.InstanceDataModel;
}

/** 办事-业务流程--发起 */
const TaskStart: React.FC<IProps> = ({ current, data, finished }) => {
  if (!finished) {
    finished = () => {};
  }
  const [loaded, apply] = useAsyncLoad(() => current.createApply(undefined, data));
  if (!loaded) {
    return (
      <Spin tip={'配置信息加载中...'}>
        <div style={{ width: '100%', height: '100%' }}></div>
      </Spin>
    );
  }
  if (apply) {
    if ('taskdata' in current) {
      return <DefaultWayStart apply={apply} work={current} finished={finished} />;
    }
    switch (apply.applyType) {
      case '列表':
        return <MultitabTable current={current as IWork} finished={finished!} />;
      case '选择':
        return <WorkSelect work={current as IWork} apply={apply} finished={finished} />;
      case '财务':
        return <BelongFinancial belong={current.directory.target.space} />;
      default:
        return (
          <DefaultWayStart apply={apply} work={current as IWork} finished={finished} />
        );
    }
  }
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Empty />
    </div>
  );
};

export default TaskStart;
