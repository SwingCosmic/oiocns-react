import { AiOutlineCloseCircle } from 'react-icons/ai';
import React, { ReactNode } from 'react';
import cls from './index.module.less';
import { Space, Typography } from 'antd';
import { CheckBox } from 'devextreme-react';
import { model } from '@/ts/base';
type ShareShowRecentProps = {
  departData: { name: string; id: string; type?: string }[];
  deleteFuc: (id: string) => void;
  onClick?: Function;
  tags?: (id: string) => ReactNode;
};

const loadOperateRule = (label: string, operateRule: any, operate: string) => {
  return (
    <Space>
      <CheckBox
        defaultValue={operateRule[operate] ?? true}
        onValueChange={(e) => (operateRule[operate] = e)}
      />
      <div style={{ width: 30 }}>{label}</div>
    </Space>
  );
};

export const FormOption = (props: { operateRule: model.FormInfo; typeName: string }) => {
  return (
    <Space>
      {loadOperateRule('新增', props.operateRule, 'allowAdd')}
      {loadOperateRule('变更', props.operateRule, 'allowEdit')}
      {loadOperateRule('选择', props.operateRule, 'allowSelect')}
    </Space>
  );
};

const ShareShowRecent: React.FC<ShareShowRecentProps> = (props) => {
  const data = props.departData || [];
  return (
    <div className={cls.layout}>
      <div className={cls.title}>已选{data.length}条数据</div>
      <div className={cls.content}>
        {data.map((el: any, idx: number) => {
          return (
            <div
              style={{
                background:
                  el?.type == 'del' ? '#ffb4c4' : el?.type == 'add' ? '#beffd0' : '',
              }}
              key={el.id}
              className={`${cls.row} ${
                data.length > 1 && idx !== data.length - 1 ? cls.mgt6 : ''
              }`}>
              <div
                onClick={() => {
                  props.onClick?.call(this, el);
                }}>
                <Typography.Text
                  style={{ fontSize: 14, lineHeight: '24px', color: '#888' }}
                  title={el.name}
                  ellipsis>
                  {props.onClick ? <a>{el.name}</a> : el.name}
                </Typography.Text>
              </div>
              {props.tags?.(el.id)}
              <AiOutlineCloseCircle
                className={cls.closeIcon}
                onClick={() => {
                  props?.deleteFuc.apply(this, [el.id]);
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ShareShowRecent;
