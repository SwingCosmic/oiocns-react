import cls from './index.module.less';
import React, { useEffect, useState } from 'react';
import HeadBanner from '@/pages/Home/components/HeadBanner';
import NavigationBar from '@/pages/Home/components/NavigationBar';
import orgCtrl from '@/ts/controller';
import { ViewerHost } from '@/components/PageBuilder/view/ViewerHost';

export interface NavigationItem {
  key: string;
  label: string;
  backgroundImageUrl: string;
  component: any;
}
const navigationList: NavigationItem[] = [
  {
    key: 'app',
    label: '工作台',
    backgroundImageUrl: '/img/banner/digital-asset-bg.png',
    component: React.lazy(() => import('@/pages/Home/components/Content/WorkBench')),
  },
  {
    key: 'activity',
    label: '群动态',
    backgroundImageUrl: '/img/banner/activity-bg.png',
    component: React.lazy(() => import('@/pages/Home/components/Content/Activity')),
  },
  {
    key: 'circle',
    label: '好友圈',
    backgroundImageUrl: '/img/banner/circle-bg.jpeg',
    component: React.lazy(() => import('@/pages/Home/components/Content/Circle')),
  },
];

const getComponents = () => {
  const subs = orgCtrl.provider.subs;
  const pages = subs?.subscribedPages.map((item) => {
    return {
      key: item.id,
      label: item.name,
      backgroundImageUrl: '/img/banner/circle-bg.jpeg',
      component: <ViewerHost current={item} />,
    };
  });
  return [...navigationList, ...(pages ?? [])];
};

const Home: React.FC = () => {
  const [list, setList] = useState(getComponents());
  const [current, setCurrent] = useState(list[0]);
  useEffect(() => {
    setList(getComponents());
  }, []);
  return (
    <div className={cls.homepage}>
      <NavigationBar
        list={list}
        onChange={(item) => {
          setCurrent(item);
        }}></NavigationBar>
      <HeadBanner
        backgroundImageUrl={current.backgroundImageUrl}
        title={current.label}></HeadBanner>
      {React.createElement(current.component)}
    </div>
  );
};
export default Home;
