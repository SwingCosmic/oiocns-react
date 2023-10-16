import { ITransfer } from '@/ts/core';
import React from 'react';
import { FullModal } from '../../../common';
import { GraphView } from './graphView';
import { ToolViews } from './toolsView';

interface IProps {
  current: ITransfer;
  finished: () => void;
}

export const TransferRunning: React.FC<IProps> = ({ current, finished }) => {
  return (
    <FullModal title={'迁移运行'} finished={finished}>
      <GraphView current={current} />
      <ToolViews current={current} />
    </FullModal>
  );
};
