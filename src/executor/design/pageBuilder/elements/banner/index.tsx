import { defineElement } from '../defineElement';
import React from 'react';

export default defineElement({
  render(props) {
    return (
      <div
        style={{
          position: 'relative',
          background: `no-repeat url(${props.url}) #fafafa center `,
          backgroundSize: 'cover',
          height: props.height,
          minHeight: 200,
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
      },
      title: {
        type: 'string',
      },
      url: {
        type: 'string',
      },
    },
    label: '横幅',
  },
});
