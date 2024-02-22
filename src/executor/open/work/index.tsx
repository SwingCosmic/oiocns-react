import { IWork, IWorkTask } from '@/ts/core';
import React from 'react';
import FullScreenModal from '@/components/Common/fullScreen';
import TaskStart from '@/executor/tools/task/start';
import { model } from '@/ts/base';
import message from '@/utils/message';
// 卡片渲染
interface IProps {
  current: IWork | IWorkTask;
  finished?: () => void;
  data?: model.InstanceDataModel;
}

/** 办事-业务流程--发起 */
const WorkStartDo: React.FC<IProps> = ({ current, finished, data }) => {
  // TODO 后续使用
  // if ('isMyWork' in current && current.isMyWork === false) {
  //   if (finished) {
  //     finished.apply(this);
  //   }
  //   message.error('不能直接发起，需要通过内部办事串联此办事');
  // }
  return (
    <FullScreenModal
      open
      centered
      fullScreen
      width={'80vw'}
      bodyHeight={'80vh'}
      destroyOnClose
      title={current.name}
      footer={[]}
      onCancel={finished}>
      <TaskStart current={current} finished={finished} data={data} />
    </FullScreenModal>
  );
};

export default WorkStartDo;
