import React, { ChangeEventHandler, useState } from 'react';
import { ExistTypeMeta, TypeMeta } from '../../core/ElementMeta';
import { DatePicker, Input, Select, Switch } from 'antd';
import FormProps from './FormProps';

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
      case 'enum':
        return <Select
          allowClear
          options={meta.options}
        />;
      case 'type':
        const exist = meta as ExistTypeMeta<any>;
        switch (exist.typeName) {
          case 'form':
            return (
              <FormProps
                value={value}
                onChange={(value) => {
                  props.onValueChange(value);
                  setValue(value);
                }}
              />
            );
        }
        break;
      case 'object':
      case 'array':
      default:
        return <></>;
    }
  }

  return (
    <div className="page-element-props-item">
      <div
        className={"item-label " + (props.meta.required ? 'is-required' : '')}
        title={props.meta.label || props.prop}
        style={{ width: props.labelWidth || '160px' }}>
        {props.meta.label || props.prop}
      </div>
      {renderComponent(props.meta)}
    </div>
  );
}
