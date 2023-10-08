import HeadBanner from '@/pages/Home/components/HeadBanner';
import NavigationBar from '@/pages/Home/components/NavigationBar';
import React, { useState } from 'react';
import cls from './index.module.less';

export interface NavigationItem {
  key: string;
  label: string;
  backgroundImageUrl: string;
  type: string;
  component: any;
}
const navigationList: NavigationItem[] = [
  {
    key: 'app',
    label: '工作台',
    backgroundImageUrl: '/img/banner/digital-asset-bg.png',
    type: 'inner',
    component: React.lazy(() => import('@/pages/Home/components/Content/WorkBench')),
  },
  {
    key: 'activity',
    label: '群动态',
    backgroundImageUrl: '/img/banner/activity-bg.png',
    type: 'inner',
    component: React.lazy(() => import('@/pages/Home/components/Content/Activity')),
  },
  {
    key: 'circle',
    label: '好友圈',
    backgroundImageUrl: '/img/banner/circle-bg.jpeg',
    type: 'inner',
    component: React.lazy(() => import('@/pages/Home/components/Content/Circle')),
  },
];

const Home: React.FC = () => {
  const [current, setCurrent] = useState(navigationList[0]);
  return (
    <div className={cls.homepage}>
      <NavigationBar list={navigationList} onChange={(item) => setCurrent(item)} />
      <HeadBanner
        backgroundImageUrl={current.backgroundImageUrl}
        title={current.label}></HeadBanner>
      {current.type == "inner" && React.createElement(current.component)}
      {current.type == "page" && current.component}
    </div>
  );
};

export default Home;
