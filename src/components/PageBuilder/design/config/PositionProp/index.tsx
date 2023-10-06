import { Image, Input } from 'antd';
import React, { CSSProperties, ReactNode, useState } from 'react';
import { useDrop } from 'react-dnd';
import Asset from '/img/banner/activity-bg.png';
import { PosVal } from '@/components/PageBuilder/type';
import { FieldModel } from '@/ts/base/model';

export interface Position {
  value: PosVal;
  setValue: (value: PosVal) => void;
}

interface IProps extends Position {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  accept: string | string[];
}

export const PositionProp: React.FC<IProps> = (props) => {
  const [{ isOver }, dropper] = useDrop<FieldModel, FieldModel, { isOver: boolean }>({
    accept: props.accept,
    collect: (monitor) => ({ isOver: monitor.isOver() }),
    drop: (item) => {
      props.setValue({ ...props.value, field: item });
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

export const FieldPositionProp: React.FC<Position> = (props) => {
  const [value, setValue] = useState(props.value);
  return (
    <PositionProp
      {...props}
      style={{ width: '100%' }}
      value={value}
      setValue={(field) => {
        setValue(field);
        props.setValue(field);
      }}
      accept={['时间型', '日期型', '字典型', '分类型', '数值型', '用户型', '描述型']}
      children={<Input disabled value={value?.field?.name ?? '拖入此处'} />}
    />
  );
};

export const ImagePositionProp: React.FC<Position> = (props) => {
  const [field, setField] = useState(props.value);
  return (
    <PositionProp
      {...props}
      value={field}
      setValue={(field) => {
        setField(field);
        props.setValue(field);
      }}
      accept={'附件型'}
      children={<Image height={200} src={Asset} />}
    />
  );
};

export default PositionProp;
