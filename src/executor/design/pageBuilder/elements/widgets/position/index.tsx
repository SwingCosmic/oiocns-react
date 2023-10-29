import { schema } from '@/ts/base';
import { shareOpenLink } from '@/utils/tools';
import { Image, Space, Tag } from 'antd';
import React from 'react';
import { ExistTypeMeta } from '../../../core/ElementMeta';
import { File, SProperty, TipDesignText, TipText } from '../../../design/config/FileProp';
import { Context } from '../../../render/PageContext';
import { defineElement } from '../../defineElement';
import Asset from '/img/innovate.png';
import { DeleteOutlined } from '@ant-design/icons';

export type DisplayType = 'Photo' | 'Text' | 'Tags';

interface IProps {
  id: string;
  ctx: Context;
  props: any;
  label: string;
  valueType: DisplayType;
  data?: schema.XThing;
  property?: SProperty;
  properties: SProperty[];
}

const Design: React.FC<IProps> = (props) => {
  switch (props.valueType) {
    case 'Tags':
      return (
        <File
          accepts={['选择型', '分类型']}
          onOk={(files) => {
            props.properties.push(
              ...files.map((item) => {
                return {
                  id: item.id,
                  name: item.name,
                  valueType: (item.metadata as schema.XProperty).valueType,
                };
              }),
            );
            props.ctx.view.emitter('props', 'change', props.id);
          }}>
          <Space direction="horizontal">
            {props.properties.map((item, index) => {
              return (
                <Space key={index}>
                  <DeleteOutlined
                    onClick={() => {
                      props.properties.splice(index, 1);
                      props.ctx.view.emitter('props', 'change', props.id);
                    }}
                  />
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
            props.props.property = files[0].metadata;
            props.ctx.view.emitter('props', 'change', props.id);
          }}>
          <TipDesignText
            height={props.valueType == 'Photo' ? 200 : undefined}
            value={props.property?.name ?? props.label}
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
      return (
        <Image
          style={{ objectFit: 'cover', height: 200 }}
          src={shareLink ? shareOpenLink(shareLink) : Asset}
        />
      );
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
      } as ExistTypeMeta<SProperty | undefined>,
      properties: {
        type: 'type',
        label: '属性组',
        typeName: 'propFile',
        default: [],
      } as ExistTypeMeta<SProperty[]>,
    },
  },
});
