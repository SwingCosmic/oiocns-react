import React, { useContext } from "react";
import "./index.less";
import { PageElement } from "../../core/PageElement";
import { DesignContext, PageContext } from "../../render/PageContext";
import { Empty, Form, Tag } from "antd";
import ElementPropsItem from "./ElementPropsItem";
import { useChangeToken } from "@/hooks/useChangeToken";
import { TypeMeta } from "../../core/ElementMeta";

interface Props {
  element: PageElement | null;
}

const commonTypeMeta: Dictionary<TypeMeta> = {
  name: {
    type: "string",
    label: "名称",
    required: true
  },
  className: {
    type: "string",
    label: "CSS类名"
  },
  style: {
    type: "string",
    label: "CSS样式"
  },
}

export default function ElementProps({ element }: Props) {
  const ctx = useContext<DesignContext>(PageContext as any);
  const [refresh] = useChangeToken(); 
  
  if (!element) {
    return <div>
      <Empty description={`请选择一个元素`} />
    </div>;
  }

  const meta = ctx.view.elements.elementMeta[element.kind] || {};

  return <div className="page-element-props">
    <div className="props-header">
      <span className="header-id">[{element.id}]</span>
      <span className="header-title">{element.name || "（未命名）"}</span>
      <Tag color="processing" className="header-kind">
        {meta.label || element.kind}
      </Tag>
    </div>
    <div className="props-content">
      {
        Object
          .entries(commonTypeMeta)
          .map(([prop, meta]) => {
            return <ElementPropsItem
              key={prop}
              value={(element as any)[prop]}
              prop={prop}
              meta={meta}
              onValueChange={v => {
                (element as any)[prop] = v;
                refresh();
              }} 
            />;
          })
      }
      <div className="diver">

      </div>
      {
        Object
          .entries(meta.props)
          .map(([prop, meta]) => {
            return <ElementPropsItem
              key={prop}
              value={element.props[prop]}
              prop={prop}
              meta={meta}
              onValueChange={v => {
                element.props[prop] = v;
                refresh();
              }} 
            />;
          })
      }
    </div>
  </div>
}