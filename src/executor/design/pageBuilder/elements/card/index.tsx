import { schema } from '@/ts/base';
import { Card, Image, Space, Tooltip } from 'antd';
import React from 'react';
import { ExistTypeMeta, ParameterInfo, TypeMeta } from '../../core/ElementMeta';
import { defineElement } from '../defineElement';
import Asset from '/img/banner/1.png';
import { shareOpenLink } from '@/utils/tools';
import { XProperty } from '@/ts/base/schema';

interface PosProps {
  property?: XProperty;
}

interface DataProps extends PosProps {
  data: schema.XThing | undefined;
}

const Name: React.FC<DataProps> = ({ data, property }) => {
  let value = data?.['T' + property?.id ?? ''];
  return (
    <div style={{ display: 'flex', width: '100%' }}>
      <div
        style={{
          flex: 1,
          width: 0,
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          overflow: 'hidden',
        }}>
        <Tooltip title={value}>{value}</Tooltip>
      </div>
    </div>
  );
};

const Content: React.FC<DataProps> = ({ data, property }) => {
  let value = '';
  if (data && property) {
    value = property.name + ':' + (data['T' + property.id] ?? '');
  }
  return <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>;
};

const ImageContent: React.FC<DataProps> = ({ data, property }) => {
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
};

const ImagePosition: React.FC<PosProps> = () => {
  return <Image src={Asset} height={200} />;
};

const DataInfo: ParameterInfo = {
  label: '数据',
  type: {
    type: 'type',
    label: '实体',
    typeName: 'thing',
  } as ExistTypeMeta<schema.XThing>,
};


export default defineElement({
  render({ card, image, first, second, third, fourth, fifth }, ctx) {
    return (
      <Card
        hoverable
        cover={image?.({ card })}
        actions={[first({ card }), second({ card })]}>
        <Card.Meta
          title={third({ card })}
          description={[fourth({ card }), fifth({ card })]}
        />
      </Card>
    );
  },
  displayName: 'MetaCard',
  meta: {
    props: {
      card: {
        type: 'type',
        typeName: 'empty',
        label: '数据',
        hidden: true,
      } as ExistTypeMeta<schema.XThing>,
    },
    slots: {
      image: {
        label: '图片',
        single: true,
        params: { card: DataInfo },
        default: 'imageField',
      },
      first: {
        label: '位置-1',
        single: true,
        params: { card: DataInfo },
        default: 'textField',
      },
      second: {
        label: '位置-2',
        single: true,
        params: { card: DataInfo },
        default: 'textField',
      },
      third: {
        label: '位置-3',
        single: true,
        params: { card: DataInfo },
        default: 'textField',
      },
      fourth: {
        label: '位置-4',
        single: true,
        params: { card: DataInfo },
        default: 'textField',
      },
      fifth: {
        label: '位置-5',
        single: true,
        params: { card: DataInfo },
        default: 'textField',
      },
    },
    type: 'Element',
    label: '实体详情',
  },
});
