import { schema } from '@/ts/base';
import { shareOpenLink } from '@/utils/tools';
import { Image, Space, Tag } from 'antd';
import React from 'react';
import { ExistTypeMeta } from '../../../core/ElementMeta';
import { File, TipDesignText, TipText } from '../../../design/config/FileProp';
import { Context } from '../../../render/PageContext';
import { defineElement } from '../../defineElement';
import Asset from '/img/innovate.png';

export type DisplayType = 'Photo' | 'Text' | 'Tags';

interface IProps {
  ctx: Context;
  props: any;
  label: string;
  valueType: DisplayType;
  data?: schema.XThing;
  property?: schema.XProperty;
  properties: schema.XProperty[];
}

const Design: React.FC<IProps> = ({ property, properties, label, valueType, props }) => {
  switch (valueType) {
    case 'Tags':
      return (
        <File
          accepts={['属性']}
          onOk={(files) => {
            properties.push(...files.map((item) => item.metadata as schema.XProperty));
            props.ctx.view.emitter('props', 'change', props.id);
          }}>
          <Space direction="horizontal">
            {properties.map((item, index) => {
              return (
                <Space key={index}>
                  <Tag>{item.name}</Tag>
                </Space>
              );
            })}
          </Space>
        </File>
      );
    default:
      return (
        <File
          accepts={['属性']}
          onOk={(files) => {
            props['property'] = files[0].metadata;
          }}>
          <TipDesignText
            height={valueType == 'Photo' ? 200 : undefined}
            value={property?.name ?? label}
          />
        </File>
      );
  }
};

const View: React.FC<IProps> = ({ valueType, data, property, label }) => {
  switch (valueType) {
    case 'Photo': {
      let shareLink = '';
      if (data && property) {
        let file = data['T' + property.id];
        if (file) {
          const parsedFile = JSON.parse(file);
          if (parsedFile.length > 0) {
            shareLink = parsedFile[0].shareLink;
          }
        }
      }
      return <Image height={200} src={shareLink ? shareOpenLink(shareLink) : Asset} />;
    }
    default: {
      let value = property?.name ?? label;
      if (data && property) {
        let suffix = '';
        switch (property.valueType) {
          case '选择型':
          case '分类型':
            suffix = data[data['T' + property.id]] ?? '';
            break;
          default:
            suffix = data['T' + property.id] ?? '';
            break;
        }
        value = property.name + ':' + suffix;
      }
      return <TipText value={value} />;
    }
  }
};

export default defineElement({
  render(props, ctx) {
    if (ctx.view.mode == 'design') {
      return <Design {...props} ctx={ctx} />;
    }
    return <View {...props} ctx={ctx} />;
  },
  displayName: 'Field',
  meta: {
    type: 'Element',
    label: '文字字段',
    props: {
      label: {
        type: 'string',
        label: '名称',
      },
      valueType: {
        type: 'type',
        label: '组件类型',
        default: 'Text',
      } as ExistTypeMeta<DisplayType>,
      data: {
        type: 'type',
        typeName: 'thing',
        label: '数据',
      } as ExistTypeMeta<schema.XThing | undefined>,
      property: {
        type: 'type',
        label: '属性',
        typeName: 'propFile',
      } as ExistTypeMeta<schema.XProperty | undefined>,
      properties: {
        type: 'type',
        label: '属性组',
        typeName: 'propFile',
        default: [],
      } as ExistTypeMeta<schema.XProperty[]>,
    },
  },
});
