import React, { useState } from 'react';
import { defineElement } from '../defineElement';
import { ExistTypeMeta } from '../../core/ElementMeta';
import { schema } from '@/ts/base';
import { Space } from 'antd';
import OpenFileDialog from '@/components/OpenFileDialog';
import { Context } from '../../render/PageContext';

interface IProps {
  ctx: Context;
  accepts: string[];
  data: schema.XThing | undefined;
  property: schema.XProperty | undefined;
}

const Design: React.FC<IProps> = (props) => {
  const [open, setOpen] = useState(false);
  return (
    <Space>
      <View {...props} />
      {open && (
        <OpenFileDialog
          accepts={props.accepts}
          rootKey={props.ctx.view.pageInfo.directory.spaceKey}
          multiple={false}
          onOk={(files) => {
            if (files.length > 0) {
              props.property = files[0].metadata as schema.XProperty;
            }
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
        />
      )}
    </Space>
  );
};

const View: React.FC<IProps> = (props) => {
  return <span>{props.property?.name}</span>;
};

export default defineElement({
  render(props, ctx) {
    if (ctx.view.mode == 'design') {
      return <Design {...props} ctx={ctx} />;
    }
    return <View {...props} ctx={ctx} />;
  },
  displayName: 'textField',
  meta: {
    type: 'Element',
    label: '文字字段',
    props: {
      accepts: {
        type: 'array',
        label: '字段类型',
        elementType: {
          type: 'string',
        },
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
