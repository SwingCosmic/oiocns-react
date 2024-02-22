import { Button, Dropdown, Spin, Image } from 'antd';
import React, { useEffect, useState } from 'react';
import orgCtrl from '@/ts/controller';
import { ISession } from '@/ts/core';
import DirectoryViewer from '@/components/Directory/views';
import { command } from '@/ts/base';
import { useFlagCmdEmitter } from '@/hooks/useCtrlUpdate';
import { cleanMenus } from '@/utils/tools';
import { loadFileMenus, operatesToMenus } from '@/executor/fileOperate';
import AppLayout from '@/components/MainLayout/appLayout';
import { personJoins } from '@/ts/core/public';
import SelectChat from './select';
import FullScreenModal from '@/components/Common/fullScreen';
import OrgIcons from '@/components/Common/GlobalComps/orgIcons';

/** 沟通-通讯录 */
const ChatContent: React.FC = () => {
  const [selectOpen, setSelectOpen] = useState(false);
  const [chats, setChats] = useState<ISession[]>([]);
  const [focusFile, setFocusFile] = useState<ISession>();
  const [loaded] = useFlagCmdEmitter('session', () => {
    setChats(filterChats(currentTag));
  });
  const [currentTag, setCurrentTag] = useState('最近');
  useEffect(() => {
    const id = command.subscribe((type, cmd, ...args: any[]) => {
      if (type != 'session' || args.length < 1) return;
      switch (cmd) {
        case 'open':
          sessionOpen(args[0]);
          break;
      }
    });
    return () => {
      command.unsubscribe(id);
    };
  }, []);

  useEffect(() => {
    setChats(filterChats(currentTag));
  }, [currentTag]);

  const filterChats = (tag: string) => {
    const temps = orgCtrl.chats.filter((i) => i.isMyChat);
    return temps
      .filter((a) => tag === '最近' || a.groupTags.includes(tag))
      .filter((i) => i.chatdata.lastMessage || i.chatdata.recently)
      .sort((a, b) => {
        if (b.chatdata.lastMsgTime == a.chatdata.lastMsgTime) {
          return b.isBelongPerson ? 1 : -1;
        } else {
          return b.chatdata.lastMsgTime > a.chatdata.lastMsgTime ? 5 : -5;
        }
      });
  };

  const contextMenu = (session: ISession | undefined) => {
    return {
      items: cleanMenus(loadFileMenus(session)) || [],
      onClick: ({ key }: { key: string }) => {
        command.emitter('executor', key, session);
      },
    };
  };

  const sessionOpen = (session: ISession | undefined) => {
    if (session?.key === focusFile?.key) {
      setFocusFile(undefined);
      command.emitter('preview', 'chat');
    } else {
      setFocusFile(session);
      command.emitter('preview', 'chat', session);
    }
  };

  const renderMore = () => {
    return (
      <Dropdown
        menu={{
          items: operatesToMenus(
            [
              ...personJoins.menus,
              {
                sort: 37,
                cmd: 'selectChat',
                label: '选择会话',
                iconType: 'selectChat',
              },
            ],
            orgCtrl.user,
          ),
          onClick: ({ key }: { key: string }) => {
            if (key === 'selectChat') {
              setSelectOpen(true);
            } else {
              command.emitter('executor', key, orgCtrl.user);
            }
          },
        }}
        dropdownRender={(menu) => (
          <div>{menu && <Button type="link">{menu}</Button>}</div>
        )}
        placement="bottom"
        trigger={['click', 'contextMenu']}>
        <div className="chat-leftBar-search_more">
          <Image
            preview={false}
            height={24}
            width={24}
            src={`/svg/operate/chatMore.svg?v=1.0.1`}
          />
        </div>
      </Dropdown>
    );
  };
  return (
    <AppLayout previewFlag={'chat'}>
      <Spin spinning={!loaded} tip={'加载中...'}>
        <div style={{ marginLeft: 10, padding: 2, fontSize: 16 }}>
          <OrgIcons type="navbar/chat" />
          <span style={{ paddingLeft: 10 }}>沟通</span>
        </div>
        <DirectoryViewer
          extraTags={false}
          height={'calc(100% - 110px)'}
          initTags={['最近', '常用', '@我', '未读', '好友', '同事', '群聊']}
          selectFiles={[]}
          focusFile={focusFile}
          content={chats}
          badgeCount={(tag) =>
            filterChats(tag)
              .map((i) => i.badgeCount ?? 0)
              .reduce((total, count) => total + count, 0)
          }
          currentTag={currentTag}
          tagChanged={(t) => setCurrentTag(t)}
          fileOpen={(entity) => sessionOpen(entity as ISession)}
          contextMenu={(entity) => contextMenu(entity as ISession)}
          rightBars={renderMore()}
        />
        {selectOpen && (
          <FullScreenModal
            open
            title={'选择会话'}
            onCancel={() => {
              setSelectOpen(false);
            }}
            destroyOnClose
            width={1000}
            bodyHeight={'75vh'}>
            <SelectChat
              onSelected={(chat: ISession) => {
                setCurrentTag('最近');
                setChats(filterChats(currentTag));
                setSelectOpen(false);
                sessionOpen(chat);
              }}
            />
          </FullScreenModal>
        )}
      </Spin>
    </AppLayout>
  );
};
export default ChatContent;
