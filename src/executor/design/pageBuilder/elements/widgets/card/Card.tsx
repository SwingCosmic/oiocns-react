import { schema } from '@/ts/base';
import { Card, Space } from 'antd';
import React from 'react';
import { ExistTypeMeta } from '../../../core/ElementMeta';
import { defineElement } from '../../defineElement';
import { data, label, valueType } from './type';

export default defineElement({
  render(props) {
    return (
      <Card
        hoverable
        cover={props.image?.({ data: props.data, label: '图片', valueType: 'Photo' })}
        actions={[
          <div key={'fourth'}>
            {props.first?.({ data: props.data, label: '字段-4' })}
          </div>,
          <div key={'fifth'}>
            {props.second?.({ data: props.data, label: '字段-5' })}
          </div>,
        ]}>
        <Card.Meta
          title={props.third?.({ data: props.data, label: '字段-1' })}
          description={
            <Space style={{ width: '100%' }} direction="vertical">
              <div key={'second'}>
                {props.fourth?.({ data: props.data, label: '字段-2' })}
              </div>
              <div key={'third'}>
                {props.fifth?.({ data: props.data, label: '字段-3' })}
              </div>
            </Space>
          }
        />
      </Card>
    );
  },
  displayName: 'MetaCard',
  meta: {
    props: {
      data: {
        type: 'type',
        typeName: 'thing',
        label: '数据',
        hidden: true,
      } as ExistTypeMeta<schema.XThing | undefined>,
    },
    slots: {
      image: {
        label: '图片',
        single: true,
        params: { data, label, valueType },
        default: 'Field',
      },
      first: {
        label: '位置-1',
        single: true,
        params: { data, label },
        default: 'Field',
      },
      second: {
        label: '位置-2',
        single: true,
        params: { data, label },
        default: 'Field',
      },
      third: {
        label: '位置-3',
        single: true,
        params: { data, label },
        default: 'Field',
      },
      fourth: {
        label: '位置-4',
        single: true,
        params: { data, label },
        default: 'Field',
      },
      fifth: {
        label: '位置-5',
        single: true,
        params: { data, label },
        default: 'Field',
      },
    },
    type: 'Element',
    label: '实体详情',
  },
});
