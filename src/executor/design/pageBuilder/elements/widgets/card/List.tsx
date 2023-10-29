import { schema } from '@/ts/base';
import { Enumerable } from '@/ts/base/common/linq';
import { ProList } from '@ant-design/pro-components';
import React from 'react';
import { ExistTypeMeta } from '../../../core/ElementMeta';
import { defineElement } from '../../defineElement';
import { length, data, label, valueType } from './type';

export default defineElement({
  render(props, ctx) {
    return (
      <ProList<schema.XStaging>
        style={{ height: '70vh', overflow: 'auto' }}
        dataSource={
          ctx.view.mode == 'design'
            ? Enumerable.Range(1, 20)
                .ToArray()
                .map(() => {
                  return {} as schema.XStaging;
                })
            : props.data
        }
        metas={{
          title: {
            render: (_, entity) => {
              return props.title?.({
                data: entity.data,
                label: '标题',
              });
            },
          },
          avatar: {
            render: (_, entity) => {
              return props.avatar?.({
                data: entity.data,
                label: '图片',
                valueType: 'Avatar',
                width: 120,
                height: 120,
              });
            },
          },
          description: {
            render: (_, entity) => {
              return props.description?.({
                data: entity.data,
                label: '描述',
              });
            },
          },
          subTitle: {
            render: (_, entity) => {
              return props.subTitle?.({
                data: entity.data,
                label: '标签组',
                valueType: 'Tags',
              });
            },
          },
          actions: {
            render: (_, entity) => {
              return props.action?.({ data: entity });
            },
          },
        }}
      />
    );
  },
  displayName: 'ListItem',
  meta: {
    props: {
      data: {
        type: 'array',
        label: '暂存列表',
        elementType: {
          type: 'type',
          typeName: '暂存',
        } as ExistTypeMeta<schema.XStaging>,
      },
    },
    slots: {
      title: {
        label: '标题',
        single: true,
        params: { data, label },
        default: 'Field',
      },
      avatar: {
        label: '头像',
        single: true,
        params: { data, label, valueType, width: length, height: length },
        default: 'Field',
      },
      description: {
        label: '描述',
        single: true,
        params: { data, label },
        default: 'Field',
      },
      subTitle: {
        label: '标签',
        single: true,
        params: { data, label, valueType },
        default: 'Field',
      },
      content: {
        label: '内容',
        single: true,
        params: { data, label },
        default: 'Field',
      },
      action: {
        label: '操作',
        single: false,
        params: { data },
      },
    },
    label: '列表卡片',
    type: 'Element',
  },
});
