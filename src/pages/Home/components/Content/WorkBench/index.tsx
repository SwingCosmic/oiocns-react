import React, { useEffect, useState } from 'react';
import { Badge, Button, Calendar, Divider, Dropdown, Space, Spin } from 'antd';
import { ImStack } from 'react-icons/im';
import { FaChevronRight } from 'react-icons/fa6';
import { useHistory } from 'react-router-dom';
import { command, model } from '@/ts/base';
import orgCtrl from '@/ts/controller';
import { formatSize } from '@/ts/base/common';
import { IApplication, IFile, TargetType } from '@/ts/core';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import { useFlagCmdEmitter } from '@/hooks/useCtrlUpdate';
import { loadFileMenus } from '@/executor/fileOperate';
import CommonGroups from './group';
import Applications from './apps';
import { cleanMenus } from '@/utils/tools';
import FullScreenModal from '@/components/Common/fullScreen';
import { Sortable } from 'devextreme-react';
import TypeIcon from '@/components/Common/GlobalComps/typeIcon';

// 工作台
const WorkBench: React.FC = () => {
  const history = useHistory();
  // 渲染数据项
  const renderDataItem = (
    title: string,
    number: string | number,
    size?: number,
    info?: string,
  ) => {
    return (
      <div className="dataItem">
        <div className="dataItemTitle">{title}</div>
        <div className="dataItemNumber">{number}</div>
        {size && size > 0 && <div className="dataItemTitle">大小:{formatSize(size)}</div>}
        {info && info.length > 0 && <div className="dataItemTitle">{info}</div>}
      </div>
    );
  };
  // 渲染沟通信息
  const RenderChat: React.FC = () => {
    const [msgCount, setMsgCount] = useState(0);
    const [loaded] = useFlagCmdEmitter('session', () => {
      setMsgCount(
        orgCtrl.chats
          .map((i) => {
            return i.isMyChat ? i.badgeCount : 0;
          })
          .reduce((total, count) => total + count, 0),
      );
    });
    return (
      <>
        <div className="cardItem-header">
          <span className="title">沟通</span>
          <span className="extraBtn">
            <span>
              未读<>{msgCount}</>条
            </span>
            <FaChevronRight />
          </span>
        </div>
        <div className="cardItem-viewer">
          <Spin spinning={!loaded}>
            <Space wrap split={<Divider type="vertical" />} size={2}>
              {renderDataItem('好友(人)', orgCtrl.user.members.length)}
              {renderDataItem(
                '同事(个)',
                orgCtrl.user.companys
                  .map((i) => i.members.map((i) => i.id))
                  .reduce(
                    (ids, current) => [
                      ...ids,
                      ...current.filter((i) => !ids.includes(i)),
                    ],
                    [],
                  ).length,
              )}
              {renderDataItem(
                '群聊(个)',
                orgCtrl.chats.filter((i) => i.isMyChat && i.isGroup).length,
              )}
              {renderDataItem('单位(家)', orgCtrl.user.companys.length)}
            </Space>
          </Spin>
        </div>
      </>
    );
  };
  // 渲染办事信息
  const RenderWork: React.FC = () => {
    const [todoCount, setTodoCount] = useState(0);
    const [ApplyCount, setApplyCount] = useState(0);
    const [CopysCount, setCopysCount] = useState(0);
    const [CompletedCount, setCompletedCount] = useState(0);
    useEffect(() => {
      const id = orgCtrl.work.notity.subscribe(() => {
        setTodoCount(orgCtrl.work.todos.length);
        orgCtrl.work.loadTaskCount('已发起').then((v) => {
          setApplyCount(v);
        });
        orgCtrl.work.loadTaskCount('抄送').then((v) => {
          setCopysCount(v);
        });
        orgCtrl.work.loadTaskCount('已办').then((v) => {
          setCompletedCount(v);
        });
      });
      return () => {
        orgCtrl.unsubscribe(id);
      };
    }, []);
    return (
      <>
        <div className="cardItem-header">
          <span className="title">办事</span>
          <span className="extraBtn">
            <span>
              待办<b>{todoCount}</b>件
            </span>
            <FaChevronRight />
          </span>
        </div>
        <div className="cardItem-viewer">
          <Space wrap split={<Divider type="vertical" />} size={2}>
            {renderDataItem('待办', todoCount)}
            {renderDataItem('已办', CompletedCount)}
            {renderDataItem('抄送', CopysCount)}
            {renderDataItem('已发起', ApplyCount)}
          </Space>
        </div>
      </>
    );
  };
  // 渲染存储数据信息
  const RendeStore: React.FC = () => {
    const [noStore, setNoStore] = useState(false);
    const [diskInfo, setDiskInfo] = useState<model.DiskInfoType>();
    useEffect(() => {
      orgCtrl.user.getDiskInfo().then((value) => {
        setDiskInfo(value);
        setNoStore(value === undefined);
      });
    }, []);
    return (
      <>
        <div className="cardItem-header">
          <span className="title">数据</span>
          <span className="extraBtn">
            <div className="svg-container">
              <img src={`/svg/home-setting.svg?v=1.0.1`} />
            </div>
            <span>管理数据</span>
          </span>
        </div>
        <div className="cardItem-viewer">
          <Space wrap split={<Divider type="vertical" />} size={6}>
            {diskInfo && (
              <>
                {renderDataItem(
                  `关系(个)`,
                  orgCtrl.chats.filter(
                    (i) => i.isMyChat && i.typeName !== TargetType.Group,
                  ).length,
                  -1,
                  `共计:${orgCtrl.chats.length}个`,
                )}
                {renderDataItem(`数据集(个)`, diskInfo.collections, diskInfo.dataSize)}
                {renderDataItem(`对象数(个)`, diskInfo.objects, diskInfo.totalSize)}
                {renderDataItem(`文件(个)`, diskInfo.filesCount, diskInfo.filesSize)}
                {renderDataItem(
                  `硬件`,
                  formatSize(diskInfo.fsUsedSize),
                  diskInfo.fsTotalSize,
                )}
              </>
            )}
            {noStore && (
              <h3 style={{ color: 'red' }}>
                {`您还未申请存储资源，
                您将无法使用本系统，
                请申请加入您的存储资源群（用来存储您的数据），
                个人用户试用存储群为（orginone_data），
                申请通过后请在关系中激活使用哦！`}
              </h3>
            )}
          </Space>
        </div>
      </>
    );
  };
  // 渲染常用信息
  const RendeCommonInfo: React.FC = () => {
    const [editMode, setEditMode] = useState<boolean>(false);
    const [commonFiles, setCommonFiles] = useState<IFile[]>([]);
    const [groups, setGroups] = useState<any>({});
    const [loaded] = useFlagCmdEmitter('commons', async () => {
      setCommonFiles(await orgCtrl.loadCommons());
    });
    const loadGroups = () => {
      const letGroups: any = { 其它: [] };
      for (const item of orgCtrl.user.commons) {
        const file = commonFiles.find(
          (i) => i.id === item.id && i.spaceId === item.spaceId,
        );
        if (file) {
          const groupName = item.groupName ?? '其它';
          letGroups[groupName] = letGroups[groupName] || [];
          letGroups[groupName].push({
            file,
            common: item,
          });
        }
      }

      return letGroups;
    };
    useEffect(() => {
      if (loaded) {
        const groups = loadGroups();
        setGroups(groups);
      }
    }, [loaded, commonFiles, orgCtrl.user.commons]);

    const contextMenu = (file: IFile) => {
      return {
        items: cleanMenus(loadFileMenus(file)) || [],
        onClick: ({ key }: { key: string }) => {
          command.emitter('executor', key, file);
        },
      };
    };
    // 加载常用
    const loadCommonCard = (item: IFile, index: number) => {
      if (index < 3) {
        return (
          <Dropdown key={item.key} menu={contextMenu(item)} trigger={['contextMenu']}>
            <div
              className="appCard"
              onClick={() => {
                command.emitter('executor', 'open', item);
              }}>
              {item.cache.tags?.includes('常用') ? (
                <Badge dot>
                  <EntityIcon entity={item.metadata} size={35} />
                </Badge>
              ) : (
                <EntityIcon entity={item.metadata} size={35} />
              )}
              <div className="appName">{item.name}</div>
              <div className="teamName">{item.directory.target.name}</div>
              <div className="teamName">{item.directory.target.space.name}</div>
            </div>
          </Dropdown>
        );
      }
    };

    const loadGroupItem = (title: string, data: any[], index: number) => {
      if (data.length < 1) return <div key={index}></div>;
      if (index > 2) return <div key={index}></div>;
      return (
        <div className="commonItem" key={index} style={{ width: 'auto', minWidth: 100 }}>
          <div className="common-header">
            <span className="title">{title}</span>
          </div>
          <div className="cardItem-viewer common-cardItem-viewer">
            <Space wrap split={<Divider type="vertical" />} size={2}>
              <Sortable
                group="commons"
                data={title}
                className="cardItem-sortable"
                dragDirection="both"
                itemOrientation="horizontal"
                onAdd={(e) => {
                  setGroups((pre: any) => {
                    const data = pre[e.fromData].splice(e.fromIndex, 1);
                    data.forEach((item: any) => {
                      item.common.groupName = e.toData;
                      if (item.common.groupName === '其它') {
                        delete item.common.groupName;
                      }
                      pre[e.toData].push(item);
                    });
                    return { ...pre };
                  });
                }}>
                {data.map((subapp, index) => {
                  return loadCommonCard(subapp.file, index);
                })}
              </Sortable>
            </Space>
          </div>
        </div>
      );
    };
    return (
      <>
        <div className="cardItem-header">
          <span className="title">常用</span>
          <span className="extraBtn" onClick={() => setEditMode((pre) => !pre)}>
            <div className="svg-container">
              <img src={`/svg/home-app.svg?v=1.0.1`} />
            </div>
            <span>全部分组</span>
          </span>
        </div>
        <Spin spinning={!loaded} tip={'加载中...'}>
          <div className="cardItem-viewer">
            <div className="cardGroup" style={{ flexWrap: 'wrap' }}>
              {Object.keys(groups).map((groupName, index) => {
                return loadGroupItem(groupName, groups[groupName], index);
              })}
            </div>
          </div>
        </Spin>
        {editMode && (
          <CommonGroups
            preGroups={groups}
            commons={orgCtrl.user.commons}
            onClose={(commons) => {
              orgCtrl.user.updateCommons(commons);
              setEditMode(false);
            }}
          />
        )}
      </>
    );
  };
  // 渲染全部应用
  const RendelastInfo: React.FC = () => {
    const [editMode, setEditMode] = useState<boolean>(false);
    const [appData, setappData] = useState<IApplication[]>([]);
    const [loaded, setLoaded] = useState<boolean>(false);
    useEffect(() => {
      orgCtrl.loadApplications().then((res) => {
        setappData(res);
        setLoaded(true);
      });
    }, [editMode]);
    const contextMenu = (file: IFile) => {
      return {
        items: cleanMenus(loadFileMenus(file)) || [],
        onClick: ({ key }: { key: string }) => {
          command.emitter('executor', key, file);
        },
      };
    };
    // 加载前8个应用
    const loadCommonCard = (item: IFile) => (
      <Dropdown key={item.key} menu={contextMenu(item)} trigger={['contextMenu']}>
        <div
          className="appCard"
          onClick={() => {
            command.emitter('executor', 'open', item);
          }}>
          <EntityIcon entity={item.metadata} size={35} />
          <div className="appName">{item.name}</div>
          <div className="teamName">{item.directory.target.name}</div>
          <div className="teamName">{item.directory.target.space.name}</div>
        </div>
      </Dropdown>
    );

    return (
      <>
        <div className="cardItem-header">
          <span className="title">最近应用</span>
          <span className="extraBtn" onClick={() => setEditMode((pre) => !pre)}>
            <div className="svg-container">
              <img src={`/svg/home-app.svg?v=1.0.1`} />
            </div>
            <span>全部应用</span>
          </span>
        </div>
        <Spin spinning={!loaded} tip={'加载中...'}>
          <div className="cardItem-viewer">
            <div className="cardGroup" style={{ flexWrap: 'wrap' }}>
              {appData
                .filter((i) => i.cache.tags?.includes('常用'))
                .map((app) => {
                  return loadCommonCard(app);
                })}
            </div>
          </div>
        </Spin>
        {editMode && (
          <FullScreenModal
            open
            title={'全部应用'}
            width={'80vw'}
            bodyHeight={'70vh'}
            onCancel={() => setEditMode((pre) => !pre)}>
            <Applications
              apps={appData}
              onSelected={(app: IApplication) => {
                command.emitter('executor', 'open', app);
              }}
            />
          </FullScreenModal>
        )}
      </>
    );
  };
  // 日历组件
  const calendarItem = () => {
    return (
      <div className="cardItem">
        <div className="cardItem-header">
          <span className="title">日历</span>
          {/* <span className={cls.extraBtn}>
            <Button type="text" size="small">
              <ImPlus /> <span>创建日程</span>
            </Button>
          </span> */}
        </div>
        <Calendar />
      </div>
    );
  };
  // 操作组件
  const RenderOperate = () => {
    // 发送快捷命令
    const renderCmdBtn = (cmd: string, title: string) => {
      return (
        <Button
          className="linkBtn"
          type="text"
          icon={
            <div className="svg-container">
              <TypeIcon iconType={cmd} size={26} />
            </div>
          }
          onClick={() => {
            command.emitter('executor', cmd, orgCtrl.user);
          }}>
          {title}
        </Button>
      );
    };
    return (
      <>
        <div className="cardItem-header">
          <span className="title">快捷操作</span>
          <span className="extraBtn" onClick={() => history.push('relation')}>
            <ImStack size={15} /> <span>更多操作</span>
          </span>
        </div>
        <div style={{ width: '100%', minHeight: 60 }} className="cardItem-viewer">
          <Space wrap split={<Divider type="vertical" />} size={6}>
            {renderCmdBtn('joinFriend', '添加好友')}
            {renderCmdBtn('joinStorage', '申请存储')}
            {renderCmdBtn('newCohort', '创建群聊')}
            {renderCmdBtn('joinCohort', '加入群聊')}
            {renderCmdBtn('newCompany', '设立单位')}
            {renderCmdBtn('joinCompany', '加入单位')}
          </Space>
        </div>
      </>
    );
  };
  return (
    <div className="workbench-content">
      <div className="cardGroup">
        <div style={{ minHeight: 80 }} className="cardItem">
          <RenderOperate />
        </div>
      </div>
      <div className="cardGroup">
        <div className="cardItem">
          <RendeCommonInfo />
        </div>
      </div>
      <div className="cardGroup">
        <div className="cardItem" onClick={() => history.push('chat')}>
          <RenderChat />
        </div>
        <div className="cardItem" onClick={() => history.push('work')}>
          <RenderWork />
        </div>
      </div>
      <div className="cardGroup">
        <div className="cardItem">
          <RendelastInfo />
        </div>
      </div>
      <div className="cardGroup">
        <div className="cardItem" onClick={() => history.push('store')}>
          <RendeStore />
        </div>
      </div>
      <div className="calendar">{calendarItem()}</div>
    </div>
  );
};

export default WorkBench;
