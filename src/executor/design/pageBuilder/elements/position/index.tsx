import OpenFileDialog from '@/components/OpenFileDialog';
import { schema } from '@/ts/base';
import React, { useState } from 'react';
import { Image, Tooltip } from 'antd';
import { ExistTypeMeta } from '../../core/ElementMeta';
import { Context } from '../../render/PageContext';
import { defineElement } from '../defineElement';
import cls from './index.module.less';
import { shareOpenLink } from '@/utils/tools';
import Asset from '/img/banner/1.png';

interface IProps {
  id: string;
  ctx: Context;
  props: any;
  label: string;
  valueType: string;
  data?: schema.XThing;
  property?: schema.XProperty;
}

interface FieldProps extends IProps {
  onClick: () => void;
}

const FieldDesign: React.FC<FieldProps> = (props) => {
  const value = props.property?.name ?? props.label;
  switch (props.valueType) {
    case '图片':
      return (
        <div className={cls.img} onClick={props.onClick}>
          {value}
        </div>
      );
    case '标题':
      return (
        <Tooltip title={value}>
          <div className={cls.text} onClick={props.onClick}>
            {value}
          </div>
        </Tooltip>
      );
    default:
      return (
        <div className={cls.text} onClick={props.onClick}>
          {value}
        </div>
      );
  }
};

const Design: React.FC<IProps> = (props) => {
  const [center, setCenter] = useState(<></>);
  return (
    <div className={cls.position}>
      <FieldDesign
        {...props}
        onClick={() =>
          setCenter(
            <OpenFileDialog
              accepts={['属性']}
              rootKey={props.ctx.view.pageInfo.directory.spaceKey}
              multiple={false}
              onOk={(files) => {
                if (files.length > 0) {
                  props.props['property'] = files[0].metadata as schema.XProperty;
                  props.ctx.view.emitter('props', 'change', props.id);
                }
                setCenter(<></>);
              }}
              onCancel={() => setCenter(<></>)}
            />,
          )
        }
      />
      {center}
    </div>
  );
};

const View: React.FC<IProps> = (props) => {
  switch (props.valueType) {
    case '图片': {
      let shareLink = '';
      if (props.data && props.property) {
        let file = props.data['T' + props.property.id];
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
      let value = props.property?.name ?? props.label;
      if (props.data && props.property) {
        value = props.property.name + ':' + (props.data['T' + props.property.id] ?? '');
      }
      return (
        <Tooltip title={value}>
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
        </Tooltip>
      );
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
        type: 'string',
        label: '字段类型',
      },
      data: {
        type: 'type',
        label: '数据',
      } as ExistTypeMeta<schema.XThing | undefined>,
      property: {
        type: 'type',
        label: '属性',
        typeName: 'propFile',
      } as ExistTypeMeta<schema.XProperty | undefined>,
    },
  },
});
