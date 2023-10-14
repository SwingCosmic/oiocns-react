import { schema } from '@/ts/base';
import { ExistTypeMeta } from '../../core/ElementMeta';
import { defineElement } from '../defineElement';
import React from 'react';

export default defineElement({
  render(props) {
    return (
      <div
        style={{
          position: 'relative',
          background: `no-repeat url(${props.url?.id}) #fafafa center `,
          backgroundSize: 'cover',
          height: props.height,
        }}>
        <div
          style={{
            position: 'absolute',
            fontSize: 22,
            left: '50%',
            top: '30%',
            transform: 'translateX(-50%)',
          }}>
          {props.title}
        </div>
      </div>
    );
  },
  displayName: 'HeadBanner',
  meta: {
    props: {
      height: {
        type: 'number',
        default: 200,
      },
      title: {
        type: 'string',
      },
      url: {
        type: 'type',
        label: '关联图片',
        typeName: 'picFile',
      } as ExistTypeMeta<schema.XEntity | undefined>,
    },
    label: '横幅',
    type: '元素',
  },
});
