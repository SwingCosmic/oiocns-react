import React, { ChangeEventHandler, useState } from 'react';
import { TypeMeta } from '../../core/ElementMeta';
import { DatePicker, Input, Switch } from 'antd';

interface Props {
  value: any;
  prop: string;
  meta: TypeMeta;
  onValueChange: (v: any) => any;
  labelWidth?: string;
}

export default function ElementPropsItem(props: Props) {
  const [value, setValue] = useState<any>(props.value);
  const inputChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    props.onValueChange(e.target.value);
    setValue(e.target.value);
  };

  function renderComponent(meta: TypeMeta) {
    switch (meta.type) {
      case 'string':
        return <Input value={value} onChange={inputChange} />;
      case 'number':
        return <Input type="number" value={value} onChange={inputChange} />;
      case 'boolean':
        return (
          <Switch
            checked={value}
            onChange={(checked) => {
              props.onValueChange(checked);
              setValue(checked);
            }}
          />
        );
      case 'date':
        return (
          <DatePicker
            value={value}
            onChange={(_, date) => {
              props.onValueChange(date);
              setValue(date);
            }}
          />
        );
      case 'object':
      case 'array':
      case 'type':
      default:
        return <></>;
    }
  }

  return (
    <div className="page-element-props-item">
      <div
        className="item-label"
        title={props.meta.label || props.prop}
        style={{ width: props.labelWidth || '160px' }}>
        {props.meta.label || props.prop}
      </div>
      {renderComponent(props.meta)}
    </div>
  );
}
