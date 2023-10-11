import React from 'react';
import { defineElement } from '../defineElement';

export default defineElement({
  render(props) {
    return <iframe width={'100%'} height={'100%'} loading="eager" src={props.url} />;
  },
  displayName: '链接',
  meta: {
    props: {
      url: {
        type: 'string',
        label: '链接地址',
      },
    },
    label: 'iframe',
  },
});
