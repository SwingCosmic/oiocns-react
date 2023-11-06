import { schema } from '@/ts/base';
import { shareOpenLink } from '@/utils/tools';
import { DeleteOutlined } from '@ant-design/icons';
import { Button, Image, Space, Tag } from 'antd';
import React, { ReactNode, useEffect, useState } from 'react';
import { ExistTypeMeta } from '../../../core/ElementMeta';
import { File, SProperty, TipDesignText, TipText } from '../../../design/config/FileProp';
import { Context } from '../../../render/PageContext';
import { defineElement } from '../../defineElement';
import Asset from '/img/innovate.png';
import QrCode from 'qrcode.react';
import orgCtrl from '@/ts/controller';

export type DisplayType = 'Photo' | 'Avatar' | 'Text' | 'Tags' | 'QrCode' | 'Belong';

interface IProps {
  id: string;
  ctx: Context;
  width?: number;
  height?: number;
  hasPrefix?: boolean;
  noTip?: boolean;
  props: any;
  label: string;
  valueType: DisplayType;
  data?: schema.XThing;
  property?: SProperty;
  properties: SProperty[];
}

const Design: React.FC<IProps> = (props) => {
  const mapping = (item: schema.XProperty) => {
    return {
      id: item.id,
      name: item.name,
      valueType: item.valueType,
      unit: item.unit,
    };
  };
  switch (props.valueType) {
    case 'Belong':
      return (
        <TipDesignText
          width={props.width}
          height={props.height}
          value={props.property?.name ?? props.label}
        />
      );
    case 'Tags':
      return (
        <File
          accepts={['选择型', '分类型']}
          excludeIds={props.properties.map((item) => item.id)}
          multiple={true}
          onOk={(files) => {
            props.properties.push(
              ...files.map((item) => mapping(item.metadata as schema.XProperty)),
            );
            props.ctx.view.emitter('props', 'change', props.id);
          }}>
          <Space direction="horizontal">
            <Button size="small" type="dashed">
              添加标签
            </Button>
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
            props.props.property = mapping(files[0].metadata as schema.XProperty);
            props.ctx.view.emitter('props', 'change', props.id);
          }}>
          <TipDesignText
            width={props.width}
            height={props.height}
            value={props.property?.name ?? props.label}
          />
        </File>
      );
  }
};

const View: React.FC<IProps> = (props) => {
  const getValue = (data: schema.XThing, property: SProperty) => {
    let suffix: any = '';
    switch (property.valueType) {
      case '选择型':
      case '分类型':
        suffix = data[data['T' + property.id]] ?? '';
        break;
      default:
        suffix = data['T' + property.id] ?? '';
        break;
    }
    return suffix;
  };
  switch (props.valueType) {
    case 'Photo':
    case 'Avatar': {
      let shareLink = '';
      if (props.data && props.property) {
        let value = getValue(props.data, props.property);
        if (value) {
          const parsedFile = JSON.parse(value);
          if (parsedFile.length > 0) {
            shareLink = parsedFile[0].shareLink;
          }
        }
      }
      return (
        <Image
          style={{ objectFit: 'cover', width: props.width, height: props.height }}
          src={shareLink ? shareOpenLink(shareLink) : Asset}
        />
      );
    }
    case 'QrCode': {
      return (
        <QrCode
          level="H"
          size={props.width}
          fgColor={'#204040'}
          value={`${location.origin}/${props.data?.id}`}
        />
      );
    }
    case 'Belong': {
      const [belongName, setBelongName] = useState<string>('归属');
      useEffect(() => {
        const belongId = props.data?.belongId;
        if (belongId) {
          orgCtrl.user.findEntityAsync(belongId).then((res) => {
            if (res?.name) {
              setBelongName(res.name);
            }
          });
        }
      });
      return <TipText value={belongName} />;
    }
    case 'Tags': {
      const tags: ReactNode[] = [];
      if (props.data) {
        for (const index in props.properties) {
          const item = props.properties[index];
          let value = getValue(props.data, item);
          if (value) {
            tags.push(
              <Tag key={index} color="green">
                {value}
              </Tag>,
            );
          }
        }
      }
      return <Space direction={'horizontal'}>{tags}</Space>;
    }
    default: {
      let value = props.noTip ? '' : '[暂无数据]';
      if (props.data && props.property) {
        let current = getValue(props.data, props.property);
        if (current || current === 0) {
          if (props.property.valueType == '数值型') {
            value = current + (props.property.unit ?? '');
          } else {
            value = current;
          }
        }
      }
      if (props.property && props.hasPrefix) {
        value = props.property.name + '：' + value;
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
      width: {
        type: 'number',
        label: '宽度',
      },
      height: {
        type: 'number',
        label: '高度',
      },
      hasPrefix: {
        type: 'type',
        label: '是否有前缀',
      } as ExistTypeMeta<boolean | undefined>,
      noTip: {
        type: 'type',
        label: '是否有[暂无数据]字样',
      } as ExistTypeMeta<boolean | undefined>,
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
