import { schema } from '@/ts/base';
import { Card, Image, Space } from 'antd';
import React from 'react';
import { ExistTypeMeta } from '../../core/ElementMeta';
import { PosVal } from '../../type';
import { defineElement } from '../defineElement';
import Asset from '/img/banner/1.png';

interface PosProps {
  pos: PosVal;
}

interface DataProps extends PosProps {
  data?: schema.XThing;
}

const Content: React.FC<DataProps> = ({ data, pos }) => {
  return (
    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {pos.field?.name}：{data && pos.field ? data[pos.field.code] : ''}
    </div>
  );
};

const ImageContent: React.FC<DataProps> = ({ data, pos }) => {
  console.log(data, data && pos.field ? data[pos.field.code ?? ''] : '');
  return <Image height={200} src={Asset} />;
};

const Position: React.FC<PosProps> = ({ pos }) => {
  return <>{pos.field?.name ?? pos.label}</>;
};

const ImagePosition: React.FC<PosProps> = ({ pos }) => {
  return <Image src={Asset} height={200} />;
};

export default defineElement({
  render({ data, image, first, second, third, fourth, fifth }, ctx) {
    if (ctx.view.mode == 'view') {
      return (
        <Card
          hoverable
          cover={<ImageContent data={data} pos={image} />}
          actions={[
            <Content key={'first'} data={data} pos={first} />,
            <Content key={'second'} data={data} pos={second} />,
          ]}>
          <Card.Meta
            title={<Content data={data} pos={third} />}
            description={
              <Space direction="vertical">
                <Content data={data} pos={fourth} />
                <Content data={data} pos={fifth} />
              </Space>
            }
          />
        </Card>
      );
    }
    return (
      <Card
        hoverable
        cover={<ImagePosition pos={image} />}
        actions={[
          <Position key={'first'} pos={first} />,
          <Position key={'second'} pos={second} />,
        ]}>
        <Card.Meta
          title={<Position pos={third} />}
          description={
            <Space direction="vertical">
              <Position pos={fourth} />
              <Position pos={fifth} />
            </Space>
          }
        />
      </Card>
    );
  },
  displayName: 'MetaCard',
  meta: {
    props: {
      formId: {
        type: 'type',
        typeName: 'attr',
        label: '表单字段',
      } as ExistTypeMeta<string>,
      data: {
        type: 'type',
        typeName: 'empty',
        label: '数据',
      } as ExistTypeMeta<schema.XThing>,
      image: {
        type: 'type',
        typeName: 'image',
        label: '图片',
        default: { position: 'image', label: '主图片' },
      } as ExistTypeMeta<PosVal>,
      first: {
        type: 'type',
        typeName: 'position',
        label: '位置-1',
        default: { position: 'first', label: '位置-1' },
      } as ExistTypeMeta<PosVal>,
      second: {
        type: 'type',
        typeName: 'position',
        label: '位置-2',
        default: { position: 'second', label: '位置-2' },
      } as ExistTypeMeta<PosVal>,
      third: {
        type: 'type',
        typeName: 'position',
        label: '位置-3',
        default: { position: 'third', label: '位置-3' },
      } as ExistTypeMeta<PosVal>,
      fourth: {
        type: 'type',
        typeName: 'position',
        label: '位置-4',
        default: { position: 'fourth', label: '位置-4' },
      } as ExistTypeMeta<PosVal>,
      fifth: {
        type: 'type',
        typeName: 'position',
        label: '位置-5',
        default: { position: 'fifth', label: '位置-5' },
      } as ExistTypeMeta<PosVal>,
    },
    label: '实体详情',
  },
});
