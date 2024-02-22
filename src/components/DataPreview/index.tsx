import ImageView from './image';
import VideoView from './video';
import {
  IEntity,
  IForm,
  ISession,
  ISysFileInfo,
  ITarget,
  IWork,
  IWorkTask,
} from '@/ts/core';
import { command, schema } from '@/ts/base';
import React from 'react';
import OfficeView from './office';
import SessionBody from './session';
import TaskBody from '@/executor/tools/task';
import JoinApply from '@/executor/tools/task/joinApply';
import EntityInfo from '@/components/Common/EntityInfo';
import WorkForm from '@/components/DataStandard/WorkForm';
import Directory from '@/components/Directory';
import TaskApproval from '@/executor/tools/task/approval';
import TaskStart from '@/executor/tools/task/start';
import PreviewLayout from './layout';
import FullScreenModal from '../Common/fullScreen';

const officeExt = ['.md', '.pdf', '.xls', '.xlsx', '.doc', '.docx', '.ppt', '.pptx'];
const videoExt = ['.mp4', '.avi', '.mov', '.mpg', '.swf', '.flv', '.mpeg'];

type EntityType =
  | IEntity<schema.XEntity>
  | ISysFileInfo
  | ISession
  | IWorkTask
  | IForm
  | ITarget
  | IWork
  | undefined;

/** 文件预览 */
const FilePreview: React.FC<{ file: ISysFileInfo }> = ({ file }) => {
  const data = file.filedata;
  if (data.contentType?.startsWith('image')) {
    return <ImageView share={data} />;
  }
  if (data.contentType?.startsWith('video') || videoExt.includes(data.extension ?? '-')) {
    return <VideoView share={data} />;
  }
  if (officeExt.includes(data.extension ?? '-')) {
    return <OfficeView share={data} />;
  }
  return <EntityInfo entity={file} column={1} />;
};

/** 数据预览 */
const DataPreview: React.FC<{
  entity?: EntityType;
  flag?: string;
  height?: string;
  finished?: () => void;
}> = ({ entity, flag, height, finished }) => {
  const renderEntityBody = (entity: any, children?: React.ReactNode) => {
    return <PreviewLayout entity={entity}>{children && children}</PreviewLayout>;
  };
  if (entity && typeof entity != 'string') {
    if ('filedata' in entity) {
      return renderEntityBody(entity, <FilePreview key={entity.key} file={entity} />);
    }
    if ('activity' in entity) {
      return <SessionBody key={entity.key} session={entity} height={height} />;
    }
    if ('fields' in entity) {
      return renderEntityBody(entity, <WorkForm key={entity.key} form={entity} />);
    }
    if ('taskdata' in entity) {
      switch (entity.taskdata.taskType) {
        case '事项':
          if (['子流程', '网关'].includes(entity.taskdata.approveType)) {
            return renderEntityBody(
              entity,
              <TaskStart key={entity.key} current={entity} finished={finished} />,
            );
          }
          return renderEntityBody(
            entity,
            <TaskBody key={entity.key} current={entity} finished={() => {}} />,
          );
        case '加用户':
          return renderEntityBody(
            entity,
            <>
              <JoinApply key={entity.key} current={entity} />
              <TaskApproval
                task={entity as any}
                finished={() => {
                  command.emitter('preview', 'work');
                }}
              />
            </>,
          );
        default:
          return <></>;
      }
    }

    if ('node' in entity) {
      return renderEntityBody(entity, <TaskStart key={entity.key} current={entity} />);
    }
    if ('session' in entity) {
      switch (flag) {
        case 'store':
          return renderEntityBody(
            entity,
            <Directory key={entity.key} root={entity.directory} />,
          );
        case 'relation':
          return (
            <SessionBody
              key={entity.key}
              relation
              session={entity.session}
              height={height}
            />
          );
      }
    }
    return renderEntityBody(entity);
  }
  return <></>;
};

/** 预览弹框 */
export const PreviewDialog: React.FC<{ entity?: EntityType; onCancel: () => void }> = ({
  entity,
  onCancel,
}) => {
  return (
    <FullScreenModal
      open
      fullScreen
      title={entity?.name}
      onCancel={onCancel}
      destroyOnClose
      width={'80vw'}
      bodyHeight={'70vh'}>
      <DataPreview entity={entity} flag="relation" height={'calc(100vh - 100px)'} />
    </FullScreenModal>
  );
};

export default DataPreview;
