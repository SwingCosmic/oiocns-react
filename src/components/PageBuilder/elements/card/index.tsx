import { Card, Space } from 'antd';
import React from 'react';
import { ExistTypeMeta } from '../../core/ElementMeta';
import { PosVal } from '../../type';
import Position, { ImagePosition } from '../../view/Position';
import { defineElement } from '../defineElement';

type PositionName = 'image' | 'first' | 'second' | 'third' | 'fourth' | 'fifth';
type IProps = {
  [key in PositionName]: PosVal;
};

const MetaCard: React.FC<IProps> = ({ image, first, second, third, fourth, fifth }) => {
  return (
    <Card
      hoverable
      style={{ width: 240 }}
      cover={<ImagePosition {...image} />}
      actions={[<Position {...first} />, <Position {...second} />]}>
      <Card.Meta
        title={<Position {...third} />}
        description={
          <Space direction="vertical">
            <Position {...fourth} />
            <Position {...fifth} />
          </Space>
        }
      />
    </Card>
  );
};

export default defineElement({
  render({ image, first, second, third, fourth, fifth }) {
    return <Card
      hoverable
      style={{ width: 240 }}
      cover={<ImagePosition {...image} />}
      actions={[<Position {...first} />, <Position {...second} />]}>
      <Card.Meta
        title={<Position {...third} />}
        description={
          <Space direction="vertical">
            <Position {...fourth} />
            <Position {...fifth} />
          </Space>
        }
      />
    </Card>;
  },
  displayName: 'MetaCard',
  meta: {
    props: {
      formId: {
        type: 'type',
        typeName: 'attr',
        label: '表单字段',
      } as ExistTypeMeta<string>,
      image: {
        type: 'type',
        typeName: 'position',
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
