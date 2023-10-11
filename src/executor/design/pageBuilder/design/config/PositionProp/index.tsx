import { FieldModel } from '@/ts/base/model';
import { Input } from 'antd';
import React, { CSSProperties, ReactNode, useState } from 'react';
import { useDrop } from 'react-dnd';
import { IExistTypeEditor } from '../IExistTypeEditor';
import { PosVal } from '../../../type';

interface IProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  accept: string | string[];
}

export const PositionProp: IExistTypeEditor<PosVal, IProps> = (props) => {
  const [{ isOver }, dropper] = useDrop<FieldModel, FieldModel, { isOver: boolean }>({
    accept: props.accept,
    collect: (monitor) => ({ isOver: monitor.isOver() }),
    drop: (item) => {
      props.onChange?.({ ...props.value, field: item });
      return item;
    },
  });
  return (
    <div
      style={{
        ...props.style,
        border: `1px dashed rgba(255, 0, 0, ${isOver ? '1' : '0'})`,
      }}
      className={props.className}
      ref={dropper}
      children={props.children}
    />
  );
};

export const FieldPositionProp: IExistTypeEditor<PosVal, IProps> = (props) => {
  const [value, setValue] = useState(props.value);
  return (
    <PositionProp
      {...props}
      style={{ width: '100%' }}
      value={value}
      onChange={(field) => {
        setValue(field);
        props.onChange?.(field);
      }}
      accept={props.accept}
      children={<Input disabled value={value?.field?.name ?? '拖入此处'} />}
    />
  );
};

export const NormalPosition: IExistTypeEditor<PosVal> = (props) => {
  return (
    <FieldPositionProp
      accept={['时间型', '日期型', '字典型', '分类型', '数值型', '用户型', '描述型']}
      value={props.value}
      onChange={props.onChange}
    />
  );
};

export const ImagePosition: IExistTypeEditor<PosVal> = (props) => {
  return (
    <FieldPositionProp
      accept={['附件型']}
      value={props.value}
      onChange={props.onChange}
    />
  );
};

export default PositionProp;
