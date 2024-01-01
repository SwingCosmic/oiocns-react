import React, { useEffect, useRef, useState } from 'react';
import { ICompany, IFile, ISession, TargetType, companyTypes } from '@/ts/core';
import { command } from '@/ts/base';
import Directory from '@/components/Directory';
import DirectoryViewer from '@/components/Directory/views';
import TargetActivity from '@/components/TargetActivity';
import { loadFileMenus } from '@/executor/fileOperate';
import ChatBody from './chat';
import PreviewLayout from '../layout';
import { cleanMenus } from '@/utils/tools';
import { Button, Card, DatePicker, Space, Tag } from 'antd';

const SessionBody = ({
  session,
  relation,
}: {
  session: ISession;
  relation?: boolean;
}) => {
  const [actions, setActions] = useState<{ key: string; label: string }[]>([]);
  const [bodyType, setBodyType] = useState('activity');

  useEffect(() => {
    const newActions = [
      {
        key: 'activity',
        label: '动态',
      },
    ];
    if (session.isMyChat && session.target.typeName !== TargetType.Group) {
      if (
        session.target.typeName !== TargetType.Storage ||
        session.target.hasRelationAuth()
      ) {
        newActions.unshift({
          key: 'chat',
          label: '沟通',
        });
        if (relation !== true) {
          setBodyType('chat');
        }
      }
    }
    if (
      session.target.typeName !== TargetType.Storage ||
      (session.target.hasRelationAuth() && session.id === session.target.id)
    ) {
      newActions.push(
        {
          key: 'store',
          label: '数据',
        },
        {
          key: 'relation',
          label: '关系',
        },
      );
      if (relation) {
        setBodyType('relation');
      }
    }
    if (session.target.hasRelationAuth()) {
      newActions.push({
        key: 'setting',
        label: '设置',
      });
    }
    setActions(newActions);
  }, [session]);

  const Setting: React.FC = () => {
    if (companyTypes.includes(session.typeName as TargetType)) {
      const company = session.target as ICompany;
      const [initPeriod, setInitPeriod] = useState(company.initPeriod);
      const [currentPeriod, setCurrentPeriod] = useState(company.currentPeriod);
      const month = useRef<string>();
      useEffect(() => {
        const initId = command.subscribeByFlag('initPeriod', () => {
          setInitPeriod(company.initPeriod);
        });
        const currentId = command.subscribeByFlag('currentPeriod', () => {
          setCurrentPeriod(company.currentPeriod);
        });
        return () => {
          command.unsubscribeByFlag(initId);
          command.unsubscribeByFlag(currentId);
        };
      }, []);
      const setPeriod = async (
        period: 'initPeriod' | 'currentPeriod',
        data: string | undefined,
      ) => {
        if (await company.cacheObj.set(period, data)) {
          await company.cacheObj.notity(period, data, true, false);
        }
      };
      const Center = () => {
        if (initPeriod) {
          return (
            <Space>
              <Tag color="green">已初始化</Tag>
              <Card>{'初始结账日期：' + (initPeriod ?? '')}</Card>
              <Card>{'当前业务时间：' + (currentPeriod ?? '')}</Card>
            </Space>
          );
        } else {
          return (
            <Space>
              <Tag color={'red'}>未初始化</Tag>
              <DatePicker
                style={{ width: '100%' }}
                picker="month"
                onChange={(_, data) => (month.current = data)}
              />
              <Button
                onClick={async () => {
                  const data = month.current;
                  await setPeriod('initPeriod', data);
                  await setPeriod('currentPeriod', data);
                }}>
                确认
              </Button>
            </Space>
          );
        }
      };
      return <Card title={'初始化账期'}>{<Center />}</Card>;
    }
  };

  const loadContext = () => {
    switch (bodyType) {
      case 'chat':
        return <ChatBody key={session.target.key} chat={session} filter={''} />;
      case 'activity':
        return <TargetActivity height={760} activity={session.activity} />;
      case 'store':
        return <Directory key={session.target.key} root={session.target.directory} />;
      case 'relation':
        return (
          <DirectoryViewer
            extraTags={false}
            currentTag={'成员'}
            initTags={['成员']}
            selectFiles={[]}
            content={session.target.memberDirectory.content()}
            fileOpen={() => {}}
            contextMenu={(entity) => {
              const file = (entity as IFile) || session.target.memberDirectory;
              return {
                items: cleanMenus(loadFileMenus(file)) || [],
                onClick: ({ key }: { key: string }) => {
                  command.emitter('executor', key, file);
                },
              };
            }}
          />
        );
      case 'setting':
        return <Setting />;
      default:
        return <></>;
    }
  };

  return (
    <PreviewLayout
      entity={session}
      actions={actions}
      selectKey={bodyType}
      onActionChanged={(key: string) => {
        setBodyType(key);
      }}
      number={session.members.length}>
      {loadContext()}
    </PreviewLayout>
  );
};
export default SessionBody;
