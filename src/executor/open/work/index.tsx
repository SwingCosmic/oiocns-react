import { IWork, IWorkTask } from '@/ts/core';
import React, { useState } from 'react';
import FullScreenModal from '@/components/Common/fullScreen';
import TaskStart from '@/executor/tools/task/start';
import { model } from '@/ts/base';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import { Empty, Modal, Spin } from 'antd';
import GenerateThingTable from '@/executor/tools/generate/thingTable';
// 卡片渲染
interface IProps {
  current: IWork | IWorkTask;
  finished?: () => void;
  data?: model.InstanceDataModel;
}

/** 办事-业务流程--发起 */
const WorkStartDo: React.FC<IProps> = ({ current, finished, data }) => {
  const [loaded, apply] = useAsyncLoad(() => current.createApply(undefined, data));
  const [center, setCenter] = useState(loadCenter());
  if (!loaded) {
    return (
      <Spin tip={'配置信息加载中...'}>
        <div style={{ width: '100%', height: '100%' }}></div>
      </Spin>
    );
  }
  if (!apply) {
    return (
      <div style={{ width: '100%', height: '100%' }}>
        <Empty />
      </div>
    );
  }
  const loadCenter = () => {
    return (
      <Modal
        open={true}
        title={'选择数据'}
        maskClosable
        width={1200}
        bodyStyle={{
          maxHeight: '100vh',
        }}
        destroyOnClose
        onCancel={finished}
        onOk={() => {
          setCenter(
            <FullScreenModal
              open
              centered
              fullScreen
              width={'80vw'}
              bodyHeight={'80vh'}
              destroyOnClose
              title={'发起流程'}
              footer={[]}
              onCancel={finished}>
              <TaskStart current={current} finished={finished} apply={apply} />
            </FullScreenModal>,
          );
        }}>
        <GenerateThingTable fields={[]} />
      </Modal>
    );
  };
  return center;
};

export default WorkStartDo;
