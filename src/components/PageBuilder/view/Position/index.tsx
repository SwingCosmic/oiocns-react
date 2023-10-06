import React from 'react';
import { PosVal } from '../../type';
import { Image } from 'antd';
import Asset from '/img/banner/activity-bg.png';

export const Position: React.FC<PosVal> = ({ field, label }) => {
  return <>{field?.name ?? label}</>;
};

export const ImagePosition: React.FC<PosVal> = () => {
  return <Image height={200} src={Asset} />;
};

export default Position;
