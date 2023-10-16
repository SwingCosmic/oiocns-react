import { ITransfer } from '@/ts/core';
import React, { useEffect, useState } from 'react';
import { FullModal } from '../../../common';
import { GraphView } from './graphView';
import { ToolViews } from './toolsView';
import { generateUuid } from '@/ts/base/common';

interface IProps {
  current: ITransfer;
  finished: () => void;
}

export const TransferRunning: React.FC<IProps> = ({ current, finished }) => {
  const [key, setKey] = useState(generateUuid());
  useEffect(() => {
    const id = current.subscribe(() => setKey(generateUuid()));
    return () => {
      current.unsubscribe(id);
    };
  }, [current.metadata]);
  return (
    <FullModal key={key} title={'迁移运行'} finished={finished}>
      <GraphView current={current} />
      <ToolViews current={current} />
    </FullModal>
  );
};
