import OpenFileDialog from '@/components/OpenFileDialog';
import { schema } from '@/ts/base';
import { shareOpenLink } from '@/utils/tools';
import { Image, Tooltip } from 'antd';
import React, { useState } from 'react';
import { ExistTypeMeta } from '../../core/ElementMeta';
import { Context } from '../../render/PageContext';
import { defineElement } from '../defineElement';
import cls from './index.module.less';
import Asset from '/img/innovate.png';

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

interface TextProps {
  value: string;
  onClick?: any;
  onMouseEnter?: any;
  onMouseLeave?: any;
}

const Text: React.FC<TextProps> = (props) => {
  return (
    <div
      className={cls.textContent}
      onClick={props.onClick}
      onMouseEnter={props.onMouseEnter}
      onMouseLeave={props.onMouseLeave}>
      <div className={cls.textOverflow}>{props.value}</div>
    </div>
  );
};

const FieldDesign: React.FC<FieldProps> = (props) => {
  const value = props.property?.name ?? props.label;
  switch (props.valueType) {
    case '图片':
      return (
        <div className={cls.img} onClick={props.onClick}>
          <Text value={value} />
        </div>
      );
    case '标题':
      return (
        <Tooltip title={value}>
          <Text value={value} onClick={props.onClick} />
        </Tooltip>
      );
    default:
      return <Text value={value} onClick={props.onClick} />;
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
    case '标题': {
      let value = props.data?.['T' + props.property?.id ?? ''] ?? '';
      return (
        <Tooltip title={value} showArrow>
          <Text value={value} />
        </Tooltip>
      );
    }
    default: {
      let value = props.property?.name ?? props.label;
      if (props.data && props.property) {
        let suffix = '';
        switch (props.property.valueType) {
          case '选择型':
          case '分类型':
            suffix = props.data[props.data['T' + props.property.id]] ?? '';
            break;
          default:
            suffix = props.data['T' + props.property.id] ?? ''
            break;
        }
        value = props.property.name + ':' + suffix;
      }
      return <Text value={value} />;
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
        typeName: 'thing',
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
