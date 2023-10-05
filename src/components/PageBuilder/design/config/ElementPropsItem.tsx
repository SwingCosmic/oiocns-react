import React, { ChangeEventHandler, useEffect, useState } from 'react';
import { ExistTypeMeta, TypeMeta } from '../../core/ElementMeta';
import { DatePicker, Input, Select, Switch } from 'antd';
import FormProps from './FormProps';

interface Props {
  target: any;
  prop: string;
  meta: TypeMeta;
  onValueChange?: (v: any) => any;
  labelWidth?: string;
}

export default function ElementPropsItem(props: Props) {
  const [value, setValue] = useState<any>(props.target[props.prop]);
  // 相当于watch props.target[props.prop]
  useEffect(() => {
    setValue(() => props.target[props.prop]);
  });

  const onValueChange = (v: any) => {
    props.target[props.prop] = v;
    setValue(v);
    props.onValueChange?.(v);
  };

  function renderComponent(meta: TypeMeta) {
    switch (meta.type) {
      case 'string':
        return <Input value={value} onChange={e => onValueChange(e.target.value)} />;
      case 'number':
        return <Input type="number" value={value} onChange={e => onValueChange(e.target.value)} />;
      case 'boolean':
        return (
          <Switch
            checked={value}
            onChange={onValueChange}
          />
        );
      case 'date':
        return (
          <DatePicker
            value={value}
            onChange={(_, date) => onValueChange(date)}
          />
        );
      case 'enum':
        return <Select
          value={value}
          onChange={onValueChange}
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
                onChange={onValueChange}
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
