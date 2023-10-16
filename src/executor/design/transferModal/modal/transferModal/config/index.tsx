import { ITransfer } from '@/ts/core';
import React from 'react';
import { FullModal, Center, NodeForms } from '../../../common';
import Editor from './editor';
import Tools from './tools';
import Settings from './settings';
import Nodes from './nodes';
import Tasks from './tasks';

interface IProps {
  current: ITransfer;
  finished: () => void;
}

export const TransferModal: React.FC<IProps> = ({ current, finished }) => {
  return (
    <FullModal title={'迁移配置'} finished={finished}>
      <Editor current={current} />
      <Tools current={current} />
      <Settings current={current} />
      <Nodes current={current} />
      <NodeForms current={current} />
      <Center current={current} />
      <Tasks current={current} />
    </FullModal>
  );
};
