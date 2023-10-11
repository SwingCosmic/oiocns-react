import React, { useEffect, useState } from 'react';

import BasicTitle from '@/pages/Home/components/BaseTitle';
import { command } from '@/ts/base';
import orgCtrl from '@/ts/controller';
import { IPageTemplate } from '@/ts/core/thing/standard/page';
import { EllipsisOutlined, MinusCircleFilled, PlusCircleFilled } from '@ant-design/icons';
import { Badge, Button, Space, Typography, message } from 'antd';
import { NavigationItem } from '../..';
import cls from './index.module.less';
import { ViewerHost } from '@/executor/design/pageBuilder/view/ViewerHost';
import ViewerManager from '@/executor/design/pageBuilder/view/ViewerManager';

const NavigationBar: React.FC<{
  list: NavigationItem[];
  onChange: (item: NavigationItem) => void;
}> = ({ list, onChange }) => {
  const [current, setCurrent] = useState(0);
  const [more, setMore] = useState(false);
  const [pages, setPages] = useState<IPageTemplate[]>([]);
  const mapping = (item: IPageTemplate) => {
    const navigation: NavigationItem = {
      key: item.id,
      label: item.name,
      backgroundImageUrl: '',
      type: 'page',
      component: <ViewerHost ctx={{ view: new ViewerManager(item) }} />
    }
    return navigation;
  };
  useEffect(() => {
    const id = command.subscribeByFlag('pages', async () => {
      setPages(await orgCtrl.loadPages());
    });
    return () => {
      command.unsubscribeByFlag(id);
    };
  }, []);
  const regularNavigation = (
    <>
      <div className={cls.navigationBarContent}>
        {[
          ...list,
          ...pages.filter((item) => item.cache.tags?.includes('常用')).map(mapping),
        ].map((item, index) => {
          return (
            <div
              key={item.key}
              className={
                current === index
                  ? cls.navigationBarContent__itemActive
                  : cls.navigationBarContent__item
              }
              onClick={() => {
                setCurrent(index);
                onChange(item);
              }}>
              {item.label}
            </div>
          );
        })}
      </div>
      <EllipsisOutlined
        onClick={() => {
          setMore(true);
        }}
        className={cls.navigationBarMore}
      />
    </>
  );

  const configNavigation = (
    <>
      <div className={cls.navigationBarConfig}>
        <div className={cls.navigationBarConfigHeader}>
          <BasicTitle title="页面管理"></BasicTitle>
          <Button type="primary" onClick={() => onSave()}>
            保存
          </Button>
        </div>
        <div className={cls.navigationBarConfigSection}>
          <Typography.Title level={5}>常用页面</Typography.Title>
          <Space size={16}>
            {pages
              .filter((item) => item.cache.tags?.includes('常用'))
              .map((item, index) => {
                return (
                  <Badge
                    count={
                      <MinusCircleFilled
                        onClick={() => {
                          removeRegularNavigationItem(item);
                        }}
                        style={{ color: 'red' }}
                      />
                    }
                    key={index}>
                    <div className={cls.navigationBarConfigPageCard}>{item.name}</div>
                  </Badge>
                );
              })}
          </Space>
        </div>
        <div className={cls.navigationBarConfigSection}>
          <Typography.Title level={5}>全部页面</Typography.Title>
          <Space size={16}>
            {pages.map((item, index) => {
              return (
                <Badge
                  count={
                    item.cache.tags?.includes('常用') ? (
                      0
                    ) : (
                      <PlusCircleFilled
                        onClick={() => {
                          addRegularNavigationItem(item);
                        }}
                        style={{ color: 'blue' }}
                      />
                    )
                  }
                  key={index}>
                  <div className={cls.navigationBarConfigPageCard}>{item.name}</div>
                </Badge>
              );
            })}
          </Space>
        </div>
      </div>
    </>
  );

  const removeRegularNavigationItem = (item: IPageTemplate) => {
    item.cache.tags = item.cache.tags?.filter((i) => i != '常用');
    item.cacheUserData(true);
    message.success('移除页面');
  };

  const addRegularNavigationItem = (item: IPageTemplate) => {
    item.cache.tags = item.cache.tags || [];
    item.cache.tags.push('常用');
    item.cacheUserData(true);
    message.success('添加页面');
  };

  const onSave = () => {
    message.success('保存成功');
    setMore(false);
  };
  return (
    <div className={`${cls.navigationBar} ${more && cls.navigationBarOpen}`}>
      {more ? configNavigation : regularNavigation}
    </div>
  );
};

export default NavigationBar;
