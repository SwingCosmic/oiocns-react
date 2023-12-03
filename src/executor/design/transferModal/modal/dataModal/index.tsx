import { Modal, Tabs } from 'antd';
import React from 'react';
import { DataTabs } from './tabs';

interface IProps {
  finished: () => void;
}

const DataModal: React.FC<IProps> = ({ finished }) => {
  return (
    <Modal
      open
      title={'数据监听'}
      onOk={() => finished()}
      onCancel={() => finished()}
      destroyOnClose={true}
      cancelText={'关闭'}
      width={1200}>
      <DataTabs />
    </Modal>
  );
};

export { DataModal };
