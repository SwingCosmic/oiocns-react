import { schema } from '@/ts/base';
import { Card } from 'antd';
import React from 'react';
import { ExistTypeMeta, ParameterInfo } from '../../core/ElementMeta';
import { defineElement } from '../defineElement';

const data: ParameterInfo = {
  label: '数据',
  type: {
    type: 'type',
    label: '实体',
    typeName: 'thing',
  } as ExistTypeMeta<schema.XThing | undefined>,
};

const label: ParameterInfo = {
  label: '位置名称',
  type: { type: 'string' },
};

const valueType: ParameterInfo = {
  label: '类型',
  type: { type: 'string' },
};

export default defineElement({
  render({ data, image, first, second, third, fourth, fifth }) {
    return (
      <Card
        hoverable
        cover={image({ data, label: '图片', valueType: '图片' })}
        actions={[
          first({ data, label: '字段-4', valueType: '描述' }),
          second({ data, label: '字段-5', valueType: '描述' }),
        ]}>
        <Card.Meta
          title={third({ data, label: '字段-1', valueType: '标题' })}
          description={[
            fourth({ data, label: '字段-2', valueType: '描述' }),
            fifth({ data, label: '字段-3', valueType: '描述' }),
          ]}
        />
      </Card>
    );
  },
  displayName: 'MetaCard',
  meta: {
    props: {
      data: {
        type: 'string',
        typeName: 'empty',
        label: '数据',
        hidden: true,
      },
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
        params: { data, label, valueType },
        default: 'Field',
      },
      second: {
        label: '位置-2',
        single: true,
        params: { data, label, valueType },
        default: 'Field',
      },
      third: {
        label: '位置-3',
        single: true,
        params: { data, label, valueType },
        default: 'Field',
      },
      fourth: {
        label: '位置-4',
        single: true,
        params: { data, label, valueType },
        default: 'Field',
      },
      fifth: {
        label: '位置-5',
        single: true,
        params: { data, label, valueType },
        default: 'Field',
      },
    },
    type: 'Element',
    label: '实体详情',
  },
});
