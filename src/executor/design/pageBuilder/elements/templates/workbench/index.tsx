import React from 'react';
import { defineElement } from '../../defineElement';
import { Layout } from 'react-grid-layout';
import { ExistTypeMeta } from '../../../core/ElementMeta';
import { Grid } from '../../layout/Grid';

export default defineElement({
  render(props) {
    console.log(props);
    return (
      <div className="workbench-content">
        <Grid
          cols={props.cols}
          rowHeight={props.rowHeight}
          layout={props.layout}
          onChange={(layout) => {
            props.props['layout'] = layout;
          }}>
          <div key="appInfo">{props.app?.({})}</div>
          <div key="calendar">{props.calendar?.({})}</div>
          <div key="chat">{props.chat?.({})}</div>
          <div key="operate">{props.operate?.({})}</div>
          <div key="store">{props.store?.({})}</div>
          <div key="work">{props.work?.({})}</div>
        </Grid>
      </div>
    );
  },
  displayName: 'WorkBench',
  meta: {
    props: {
      cols: {
        type: 'number',
        default: 12,
      },
      rowHeight: {
        type: 'number',
        default: 8,
      },
      layout: {
        type: 'array',
        elementType: {
          type: 'type',
          typeName: '布局节点',
        } as ExistTypeMeta<Layout>,
        default: [
          { i: 'operate', x: 0, y: 0, w: 12, h: 10 },
          { i: 'chat', x: 0, y: 10, w: 6, h: 10 },
          { i: 'work', x: 6, y: 20, w: 6, h: 10 },
          { i: 'store', x: 0, y: 30, w: 12, h: 10 },
          { i: 'appInfo', x: 0, y: 40, w: 12, h: 10 },
          { i: 'calendar', x: 0, y: 50, w: 12, h: 10 },
        ],
      },
    },
    slots: {
      app: {
        label: '应用',
        single: true,
        params: {},
        default: 'AppInfo',
      },
      calendar: {
        label: '日历',
        single: true,
        params: {},
        default: 'Calendar',
      },
      chat: {
        label: '沟通',
        single: true,
        params: {},
        default: 'Chat',
      },
      operate: {
        label: '快捷操作',
        single: true,
        params: {},
        default: 'Operate',
      },
      store: {
        label: '数据',
        single: true,
        params: {},
        default: 'Store',
      },
      work: {
        label: '办事',
        single: true,
        params: {},
        default: 'Work',
      },
    },
    type: 'Template',
    layoutType: 'full',
    description: '用于自定义工作台',
    label: '工作台',
  },
});
