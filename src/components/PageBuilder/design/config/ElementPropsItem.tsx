import React, { ChangeEventHandler, useCallback, useContext } from "react";
import { TypeMeta } from "../../core/ElementMeta";
import { DatePicker, Input, Switch } from "antd";

interface Props {
  value: any;
  prop: string;
  meta: TypeMeta;
  onValueChange: (v: any) => any;
  labelWidth?: string;
}



export default function ElementPropsItem(props: Props) {
  const inputChange = useCallback<ChangeEventHandler<HTMLInputElement>>(e => 
    props.onValueChange(e.target.value), [props.onValueChange]);
  console.log(props.prop)

  function renderComponent(meta: TypeMeta) {
    switch (meta.type) {
      case "string":
        return <Input value={props.value} onChange={inputChange} />
      case "number":
        return <Input type="number" value={props.value} onChange={inputChange} />
      case "boolean":
        return <Switch checked={props.value} onChange={props.onValueChange}/>
      case "date":
        return <DatePicker value={props.value} onChange={props.onValueChange}/>
      case "object":
      case "array":
      case "type":
      default:
        return <></>;
    }
  }

  return (
    <div className="page-element-props-item">
      <div className="item-label" 
        title={props.meta.label || props.prop}
        style={{ width: props.labelWidth || "160px" }}>
        {props.meta.label || props.prop}
      </div>
      {renderComponent(props.meta)}
    </div>
  )
}