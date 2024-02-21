import { PageModel } from '../../base/model';
import { TargetType, ValueType } from './enums';

/** 资产共享云模块权限Id */
export const orgAuth = {
  // 超管权限
  SuperAuthId: '361356410044420096',
  // 关系管理权限
  RelationAuthId: '361356410623234048',
  // 数据管理权限
  DataAuthId: '361356410698731520',
};
/** 支持的单位类型 */
export const companyTypes = [TargetType.Company];
/** 支持的单位类型 */
export const departmentTypes = [
  TargetType.Department,
  TargetType.College,
  TargetType.Office,
  TargetType.Section,
  TargetType.Major,
  TargetType.Working,
  TargetType.Research,
  TargetType.Laboratory,
];
/** 支持的值类型 */
export const valueTypes = [
  ValueType.Number,
  ValueType.Remark,
  ValueType.Select,
  ValueType.Species,
  ValueType.Time,
  ValueType.Target,
  ValueType.Date,
  ValueType.File,
  ValueType.Reference,
];
/** 表单弹框支持的类型 */
export const formModalType = {
  New: 'New',
  Edit: 'Edit',
  View: 'View',
};
/** 用于获取全部的分页模型 */
export const PageAll: PageModel = {
  offset: 0,
  limit: (2 << 15) - 1, //ushort.max
  filter: '',
};

/** 通用状态信息Map */
export const StatusMap = new Map([
  [
    1,
    {
      color: 'blue',
      text: '待处理',
    },
  ],
  [
    100,
    {
      color: 'green',
      text: '已同意',
    },
  ],
  [
    200,
    {
      color: 'red',
      text: '已拒绝',
    },
  ],
  [
    102,
    {
      color: 'green',
      text: '已发货',
    },
  ],
  [
    220,
    {
      color: 'gold',
      text: '买方取消订单',
    },
  ],
  [
    221,
    {
      color: 'volcano',
      text: '卖方取消订单',
    },
  ],
  [
    222,
    {
      color: 'default',
      text: '已退货',
    },
  ],
  [
    240,
    {
      color: 'red',
      text: '已取消',
    },
  ],
]);

export const collections = [
  {
    key: 'system',
    title: '系统相同',
    disableCheckbox: true,
    children: [
      {
        key: '_system-objects',
        title: '系统对象',
        disableCheckbox: true,
        children: [
          {
            key: 'depreciation-config',
            title: '折旧配置',
            tags: ['全部的'],
          },
        ],
      },
      {
        key: '_system-things',
        title: '物',
        tags: ['归属的'],
      },
      {
        key: '_system-things-changed',
        title: '物的变更',
        tags: ['归属的'],
      },
      {
        key: '_system-things-snapshot',
        title: '物的快照',
        tags: ['归属的'],
      },
      {
        key: '_system-things_{period}',
        title: '物的结账快照',
        tags: ['归属的'],
      },
    ],
  },
  {
    key: 'financial',
    title: '财务相关',
    disableCheckbox: true,
    children: [
      {
        key: 'financial-closing-options',
        title: '财务结账配置',
        tags: ['全部的'],
      },
      {
        key: 'financial-closings',
        title: '财务结账科目项',
        tags: ['归属的'],
      },
      {
        key: 'financial-period',
        title: '财务账期',
        tags: ['归属的'],
      },
      {
        key: 'financial-query',
        title: '财务查询方案',
        tags: ['全部的'],
      },
      {
        key: 'financial-depreciation',
        title: '折旧临时集合',
        disabled: true,
      },
    ],
  },
  {
    key: 'resource',
    title: '标准文件',
    disableCheckbox: true,
    children: [
      {
        key: 'resource-directory',
        title: '资源目录',
        tags: ['选择的']
      },
      {
        key: 'resource-directory-temp',
        title: '临时目录（附件迁移）',
      },
      {
        key: 'resource-file-link',
        title: '文件链接',
        disabled: true,
      },
    ],
  },
  {
    key: 'standard',
    title: '标准相关',
    disableCheckbox: true,
    children: [
      {
        key: 'standard-application',
        title: '标准应用',
        tags: ['全部的'],
      },
      {
        key: 'standard-form',
        title: '标准表单',
        tags: ['全部的'],
      },
      {
        key: 'standard-property',
        title: '标准属性',
        tags: ['全部的'],
      },
      {
        key: 'standard-species',
        title: '标准分类',
        tags: ['全部的'],
      },
      {
        key: 'standard-species-item',
        title: '标准分类项',
        tags: ['全部的'],
      },
      {
        key: 'standard-defined-coll',
        title: '标准自定义集合',
        tags: ['全部的'],
      },
    ],
  },
  {
    key: 'work',
    title: '办事相关',
    disableCheckbox: true,
    children: [
      {
        key: 'work-instance',
        title: '办事实例',
        disabled: true,
      },
      {
        key: 'work-task',
        title: '办事任务',
        disabled: true,
      },
    ],
  },
  {
    key: 'log',
    title: '日志相关',
    disableCheckbox: true,
    children: [
      {
        key: 'operation-log',
        title: '操作日志',
        disabled: true,
      },
    ],
  },
];
