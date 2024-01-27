import React, { useRef, useState } from 'react';
import {
  IApplication,
  IDirectory,
  IEntity,
  IFile,
  IGroup,
  IMemeber,
  ISession,
  IStorage,
  ISysFileInfo,
  ITarget,
  IWork,
} from '@/ts/core';
import orgCtrl from '@/ts/controller';
import QrCode from 'qrcode.react';
import { command, model, schema } from '@/ts/base';
import { Button, List, Modal, Progress, Space, Upload } from 'antd';
import message from '@/utils/message';
import { uploadBusiness, uploadStandard } from './tools/uploadTemplate';
import TypeIcon from '@/components/Common/GlobalComps/typeIcon';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import { shareOpenLink } from '@/utils/tools';
import { XStandard } from '@/ts/base/schema';
import { IStandardFileInfo } from '@/ts/core/thing/fileinfo';
import OpenFileDialog from '@/components/OpenFileDialog';
/** 执行非页面命令 */
export const executeCmd = (cmd: string, entity: any) => {
  switch (cmd) {
    case 'qrcode':
      return entityQrCode(entity);
    case 'reload':
      return directoryRefresh(entity, true);
    case 'refresh':
      return directoryRefresh(entity, false);
    case 'openChat':
      return openChat(entity);
    case 'download':
      if ('shareInfo' in entity) {
        const link = (entity as ISysFileInfo).shareInfo().shareLink;
        window.open(shareOpenLink(link, true), '_black');
      }
      return;
    case 'copy':
    case 'move':
      return setCopyFiles(cmd, entity);
    case 'parse':
      return copyBoard(entity);
    case 'delete':
      return deleteEntity(entity, false);
    case 'hardDelete':
      return deleteEntity(entity, true);
    case 'shortcut':
      return createShortcut(entity);
    case 'restore':
      return restoreEntity(entity);
    case 'remove':
      return removeMember(entity);
    case 'newFile':
      return uploadFile(entity, (file) => {
        if (file) {
          entity.changCallback();
        }
      });
    case 'workForm':
      return openWork(entity);
    case 'standard':
      return uploadStandard(entity);
    case 'business':
      return uploadBusiness(entity);
    case 'online':
    case 'outline':
      return onlineChanged(cmd, entity);
    case 'activate':
      return activateStorage(entity);
    case 'hslSplit':
      return videoHslSplit(entity);
    case 'removeSession':
      return removeSession(entity);
    case 'topingToggle':
      return sessionTopingToggle(entity);
    case 'readedToggle':
      return sessionReadedToggle(entity);
    case 'commonToggle':
      return fileCommonToggle(entity);
    case 'applyFriend':
      return applyFriend(entity);
    case 'genSpecies':
      return generateSpecies(entity);
  }
  return false;
};

/** 刷新目录 */
const directoryRefresh = (dir: IDirectory | IApplication, reload: boolean) => {
  dir.loadContent(reload).then(() => {
    orgCtrl.changCallback();
  });
};

/** 激活存储 */
const activateStorage = (store: IStorage) => {
  store.activateStorage();
};

/** 视频切片 */
const videoHslSplit = (file: ISysFileInfo) => {
  const modal = Modal.confirm({
    title: '切片前确认',
    content: `视频截屏需要较长的时间,默认等待时间为2s,
              如果提示超时并非失败,请等待片刻后尝试刷新。`,
    okText: '确认切片',
    cancelText: '取消',
    onOk: async () => {
      await file.hslSplit();
      modal.destroy();
    },
    onCancel: () => {
      modal.destroy();
    },
  });
};

/** 移除会话 */
const removeSession = (entity: ISession) => {
  entity.chatdata.recently = false;
  entity.chatdata.lastMessage = undefined;
  entity.cacheChatData();
  command.emitterFlag('session', true);
  command.emitter('preview', 'chat', undefined);
};

/** 会话置顶变更 */
const sessionTopingToggle = (entity: ISession) => {
  entity.chatdata.isToping = !entity.chatdata.isToping;
  entity.cacheChatData();
  command.emitterFlag('session', true);
};

/** 会话已读/未读变更 */
const sessionReadedToggle = (entity: ISession) => {
  if (entity.chatdata.noReadCount > 0) {
    entity.chatdata.noReadCount = 0;
  } else {
    entity.chatdata.noReadCount = 1;
  }
  entity.cacheChatData();
  command.emitterFlag('session', true);
};

/** 常用标签变更 */
const fileCommonToggle = (entity: any) => {
  entity.toggleCommon().then((success: boolean) => {
    if (success) {
      message.info('设置成功');
    }
  });
};
/** 申请加为好友 */
const applyFriend = (entity: ISession) => {
  orgCtrl.user.applyJoin([entity.metadata as schema.XTarget]).then(() => {
    orgCtrl.changCallback();
  });
};

/** 进入办事 */
const openWork = (entity: IWork) => {
  orgCtrl.currentKey = entity.key;
  orgCtrl.changCallback();
};

/** 拷贝/剪切文件 */
const setCopyFiles = (cmd: string, file: IFile) => {
  const key = cmd + '_' + file.id;
  for (const k of orgCtrl.user.copyFiles.keys()) {
    if (k.endsWith(file.id)) {
      orgCtrl.user.copyFiles.delete(k);
    }
  }
  orgCtrl.user.copyFiles.set(key, file);
  message.info(`${file.name}已放入剪切板`);
};

function isDirectory(file: IFile): file is IDirectory {
  return file.typeName == '目录';
}

function checkCycle(dir: IDirectory, target: IDirectory): true | string {
  if (target.isShortcut) {
    return '不能将目录移动到快捷方式中';
  }

  // 此处的id都是真实目录id
  if (dir.id == target.id) {
    return '移动的目标不能是自身';
  }

  let parent = target.parent;
  while (parent) {
    if (parent.id == dir.id) {
      return '移动的目标不能是自身的子目录中';
    }
    parent = parent.parent;
  }
  return true;
}

/** 剪贴板操作 */
const copyBoard = (dir: IDirectory) => {
  const datasource: { key: string; cmd: string; file: IFile }[] = [];
  for (const item of orgCtrl.user.copyFiles.entries()) {
    if (
      (item[1].typeName === '人员' && dir.typeName === '成员目录') ||
      (item[1].typeName !== '人员' && dir.typeName === '目录') ||
      (['应用', '办事', '模块'].includes(item[1].typeName) &&
        ['应用', '模块'].includes(dir.typeName))
    ) {
      datasource.push({
        key: item[0],
        cmd: item[0].split('_')[0],
        file: item[1],
      });
    }
  }
  const modal = Modal.confirm({
    icon: <></>,
    width: 500,
    cancelText: '取消',
    okText: '全部',
    onOk: async () => {
      for (const item of datasource) {
        if (item.cmd === 'copy') {
          await item.file.copy(dir);
        } else {
          if (isDirectory(item.file)) {
            let result = checkCycle(item.file, dir);
            if (typeof result === 'string') {
              message.warn(result);
              modal.destroy();
              return;
            }
          }
          await item.file.move(dir);
        }
        orgCtrl.user.copyFiles.delete(item.key);
      }
      orgCtrl.changCallback();
      modal.destroy();
    },
    content: (
      <List
        itemLayout="horizontal"
        dataSource={datasource}
        renderItem={({ key, cmd, file }) => {
          return (
            <List.Item
              style={{ cursor: 'pointer', padding: 6 }}
              actions={[
                <div key={file.name} style={{ width: 60 }}>
                  {cmd === 'copy' ? '复制' : '移动'}
                </div>,
              ]}
              onClick={async () => {
                modal.destroy();
                if (cmd === 'copy') {
                  await file.copy(dir);
                } else {
                  await file.move(dir);
                }
                orgCtrl.user.copyFiles.delete(key);
                orgCtrl.changCallback();
              }}>
              <List.Item.Meta
                avatar={<TypeIcon iconType={file.typeName} size={50} />}
                title={<strong>{file.name}</strong>}
                description={<EntityIcon entityId={file.directory.belongId} showName />}
              />
            </List.Item>
          );
        }}
      />
    ),
  });
};

/** 打开会话 */
const openChat = (entity: IMemeber | ITarget) => {
  if (entity.session) {
    entity.session.chatdata.recently = true;
    entity.session.chatdata.lastMsgTime = new Date().getTime();
    entity.session.cacheChatData();
  }
  command.emitter('executor', 'link', '/chat');
  setTimeout(() => {
    command.emitter('session', 'open', entity.session);
  }, 200);
};

/** 恢复实体 */
const restoreEntity = (entity: IFile) => {
  entity.restore().then((success: boolean) => {
    if (success) {
      orgCtrl.changCallback();
    }
  });
};

/** 删除实体 */
const deleteEntity = (entity: IFile, hardDelete: boolean) => {
  Modal.confirm({
    okText: '确认',
    cancelText: '取消',
    title: '删除询问框',
    content: (
      <div style={{ fontSize: 16 }}>
        确认要{hardDelete ? '彻底' : ''}删除{entity.typeName}[{entity.name}]吗?
      </div>
    ),
    onOk: async () => {
      const success = await (hardDelete ? entity.hardDelete() : entity.delete());
      if (success) {
        orgCtrl.changCallback();
      }
    },
  });
};

/** 移除成员 */
const removeMember = (member: IMemeber) => {
  Modal.confirm({
    icon: <></>,
    title: `确认要移除成员[${member.name}]吗?`,
    onOk: () => {
      member.directory.target
        .removeMembers([member.metadata])
        .then((success: boolean) => {
          if (success) {
            orgCtrl.changCallback();
          }
        });
    },
  });
};

/** 实体二维码 */
const entityQrCode = (entity: IEntity<schema.XEntity>) => {
  Modal.info({
    icon: <></>,
    okText: '关闭',
    maskClosable: true,
    content: (
      <div style={{ textAlign: 'center' }}>
        <QrCode
          level="H"
          size={300}
          fgColor={'#204040'}
          value={`${location.origin}/${entity.id}`}
          imageSettings={{
            src: entity.share.avatar?.thumbnail ?? '',
            width: 80,
            height: 80,
            excavate: true,
          }}
        />
        <div
          style={{
            fontSize: 22,
            marginTop: 10,
          }}>
          {entity.name}
        </div>
      </div>
    ),
  });
};

/** 上下线提醒 */
const onlineChanged = (cmd: string, info: model.OnlineInfo) => {
  if (info.userId != '0') {
    orgCtrl.user.findEntityAsync(info.userId).then((target) => {
      if (target) {
        if (cmd === 'online') {
          message.info(`${target.name} [${target.code}] 从${info.remoteAddr}上线啦`);
        } else {
          message.error(`${target.name} [${target.code}] 从${info.remoteAddr}下线啦`);
        }
      }
    });
  }
};

/** 文件上传 */
const uploadFile = (dir: IDirectory, uploaded?: (file: IFile | undefined) => void) => {
  const modal = Modal.info({
    icon: <></>,
    okText: '关闭',
    width: 610,
    title: '文件上传',
    maskClosable: true,
    content: (
      <Upload
        multiple
        type={'drag'}
        maxCount={100}
        showUploadList={false}
        style={{ width: 550, height: 300 }}
        customRequest={async (options) => {
          modal.destroy();
          command.emitter('executor', 'taskList', dir);
          const file = options.file as File;
          if (file) {
            uploaded?.apply(this, [await dir.createFile(file)]);
          }
        }}>
        <div style={{ color: 'limegreen', fontSize: 22 }}>点击或拖拽至此处上传</div>
      </Upload>
    ),
  });
};

/** 创建快捷方式 */
const createShortcut = async (entity: IStandardFileInfo<XStandard>) => {
  if (await entity.createShortcut()) {
    orgCtrl.changCallback();
  }
};

/** 生成分类树 */
const generateSpecies = async (entity: IGroup) => {
  const Compo = () => {
    const [center, setCenter] = useState(<></>);
    const progressRef = useRef(0);
    const [progress, setProgress] = useState(0);
    return (
      <>
        <Space style={{ width: '100%' }} direction="vertical">
          <Button
            type="primary"
            ghost
            onClick={() => {
              setCenter(
                <OpenFileDialog
                  accepts={['目录']}
                  rootKey={entity.space.key}
                  onOk={(files: IFile[]) => {
                    if (files.length > 0) {
                      entity.generateSpecies(files[0] as IDirectory, (total) => {
                        progressRef.current += 1;
                        setProgress(
                          Number(((progressRef.current * 100.0) / total).toFixed(2)),
                        );
                      });
                    }
                    setCenter(<></>);
                  }}
                  onCancel={() => {
                    setCenter(<></>);
                  }}
                />,
              );
            }}>
            选择生成位置
          </Button>
          <Progress percent={progress} />
        </Space>
        {center}
      </>
    );
  };
  const modal = Modal.info({
    icon: <></>,
    okText: '关闭',
    width: 610,
    title: '生成组织分类',
    maskClosable: true,
    onOk: () => modal.destroy(),
    content: <Compo />,
  });
};
