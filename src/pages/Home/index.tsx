import cls from './index.module.less';
import React, { useState } from 'react';
import NavigationBar from './components/NavigationBar';
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
    type: 'inner',
    backgroundImageUrl: '/img/banner/digital-asset-bg.png',
    component: React.lazy(() => import('./components/Content/WorkBench')),
  },
  {
    key: 'cohort',
    label: '群动态',
    type: 'inner',
    backgroundImageUrl: '/img/banner/activity-bg.png',
    component: React.lazy(() => import('./components/Content/Activity/cohort')),
  },
  {
    key: 'friends',
    label: '好友圈',
    type: 'inner',
    backgroundImageUrl: '/img/banner/circle-bg.jpeg',
    component: React.lazy(() => import('./components/Content/Activity/friends')),
  },
];
const Home: React.FC = () => {
  const [current, setCurrent] = useState(navigationList[0]);

  return (
    <div
      className={cls.homepage}
      style={{ backgroundImage: `url(${current.backgroundImageUrl})` }}>
      {current.type == 'inner' && <div className={cls.headBanner}></div>}
      {current.type == 'inner' && React.createElement(current.component)}
      {current.type == 'page' && current.component}
      <NavigationBar
        list={navigationList}
        onChange={(item) => {
          setCurrent(item);
        }}
      />
    </div>
  );
};
export default Home;
