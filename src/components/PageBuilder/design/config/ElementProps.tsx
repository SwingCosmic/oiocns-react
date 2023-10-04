import React, { useContext } from "react";
import "./index.less";
import { PageElement } from "../../core/PageElement";
import { DesignContext, PageContext } from "../../render/PageContext";
import { Empty } from "antd";

interface Props {
  element: PageElement | null;
}

export default function ElementProps({ element }: Props) {
  const ctx = useContext<DesignContext>(PageContext as any);
  const meta = ctx.view.elements.elementMeta;
  
  if (!element) {
    return <div>
      <Empty description={`请选择一个元素`} />
    </div>;
  }

  return <div className="page-element-props">
    <div>
      <span style={{ marginRight: "8px" }}>{element.id}</span>
      <span>{element.name}</span>
    </div>
    <div>

    </div>
  </div>
}