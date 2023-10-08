import React, { useEffect, useState } from 'react';

import BasicTitle from '@/pages/Home/components/BaseTitle';
import { command } from '@/ts/base';
import orgCtrl from '@/ts/controller';
import { IPageTemplate } from '@/ts/core/thing/standard/page';
import { EllipsisOutlined, MinusCircleFilled, PlusCircleFilled } from '@ant-design/icons';
import { Badge, Button, Space, Typography, message } from 'antd';
import cls from './index.module.less';
import { NavigationItem } from '../..';
import { ViewerHost } from '@/components/PageBuilder/view/ViewerHost';

const NavigationBar: React.FC<{
  list: NavigationItem[];
  onChange: (item: NavigationItem) => void;
}> = ({ onChange, list }) => {
  const [current, setCurrent] = useState(list.length > 0 ? list[0].key : '');
  const [more, setMore] = useState(false);
  const [pages, setPages] = useState<IPageTemplate[]>([]);
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
        {list.map((item) => {
          return (
            <div
              key={item.key}
              className={
                current === item.key
                  ? cls.navigationBarContent__itemActive
                  : cls.navigationBarContent__item
              }
              onClick={() => {
                setCurrent(item.key);
                onChange(item);
              }}>
              {item.label}
            </div>
          );
        })}
        {pages
          .filter((item) => item.cache.tags?.includes('常用'))
          .map((item) => {
            return (
              <div
                key={item.key}
                className={
                  current === item.id
                    ? cls.navigationBarContent__itemActive
                    : cls.navigationBarContent__item
                }
                onClick={() => {
                  setCurrent(item.id);
                  onChange({
                    key: item.id,
                    label: item.name,
                    backgroundImageUrl: '/img/banner/circle-bg.jpeg',
                    type: "page",
                    component: <ViewerHost current={item} />,
                  });
                }}>
                {item.name}
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
