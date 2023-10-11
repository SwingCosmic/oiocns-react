import { defineElement } from '../defineElement';
import React from 'react';

export default defineElement({
  render() {
    return <></>;
  },
  displayName: 'HeadBanner',
  meta: {
    props: {
      title: {
        type: 'string',
      },
      backgroundImageUrl: {
        type: 'string',
      },
    },
    label: '横幅',
  },
});
