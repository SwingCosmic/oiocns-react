import React from 'react';
import { schema } from '@/ts/base';
import { IEntity, IWork } from '@/ts/core';
import SpeciesModal from './speciesModal';
import WorkModal from './workModal';
import FillWorkModal from './fillWorkModal';
import FormModal from './formModal';
import { TransferModal } from './transferModal';
import TemplateModal from './templateModal';
interface IProps {
  cmd: string;
  entity: IEntity<schema.XEntity>;
  finished: () => void;
}

const OperateModal: React.FC<IProps> = ({ cmd, entity, finished }) => {
  switch (entity.typeName) {
    case '表单':
      return <FormModal finished={finished} current={entity as any} />;
    case '迁移配置':
      return <TransferModal finished={finished} current={entity as any} />;
    case '页面模板':
      return <TemplateModal finished={finished} current={entity as any} />;
    case '办事':
      if (cmd == 'fillWork') {
        return <FillWorkModal finished={finished} current={entity as any} />;
      }
      if ((entity as IWork).metadata.allowClaim) {
        return <WorkModal finished={finished} current={entity as any} />;
      }
      return <WorkModal finished={finished} current={entity as any} />;
    case '字典':
    case '分类':
      return <SpeciesModal finished={finished} current={entity as any} />;
    default:
      return <></>;
  }
};

export default OperateModal;
