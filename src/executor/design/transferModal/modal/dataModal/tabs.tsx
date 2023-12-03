import { kernel } from '@/ts/base';
import { generateUuid } from '@/utils/excel';
import { Tabs } from 'antd';
import React, { useEffect } from 'react';

interface IProps {}

export const DataTabs: React.FC<IProps> = () => {
  const [items, setItems] = React.useState([]);
  useEffect(() => {
    const key = generateUuid();
    kernel.subscribe('transfer-data', [key], (data: any) => {
      console.log(data);
    });
    return () => {
      kernel.unSubscribe(key);
    };
  });
  return <Tabs items={items}></Tabs>;
};
