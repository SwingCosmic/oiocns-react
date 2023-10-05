import React, { useContext } from "react";
import "./index.less";
import { PageElement } from "../../core/PageElement";
import { DesignContext, PageContext } from "../../render/PageContext";
import { Empty, Form, Tag } from "antd";
import ElementPropsItem from "./ElementPropsItem";
import { useChangeToken } from "@/hooks/useChangeToken";

interface Props {
  element: PageElement | null;
}

export default function ElementProps({ element }: Props) {
  const ctx = useContext<DesignContext>(PageContext as any);
  
  
  if (!element) {
    return <div>
      <Empty description={`请选择一个元素`} />
    </div>;
  }

  const meta = ctx.view.elements.elementMeta[element.kind] || {};
  // const [refresh] = useChangeToken(); 

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
          .entries(meta.props)
          .map(([prop, meta]) => {
            return <ElementPropsItem
              key={prop}
              value={element.props[prop]}
              prop={prop}
              meta={meta}
              onValueChange={v => {
                element.props[prop] = v;
                ctx.view.rootChildren = [...ctx.view.rootChildren];
                // refresh();
              }} 
            />;
          })
      }
    </div>
  </div>
}