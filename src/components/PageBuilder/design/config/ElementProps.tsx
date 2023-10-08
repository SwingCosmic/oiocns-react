import React, { useContext, useState } from "react";
import "./index.less";
import { PageElement } from "../../core/PageElement";
import { DesignContext, PageContext } from "../../render/PageContext";
import { Button, Empty, Form, Tag } from "antd";
import ElementPropsItem from "./ElementPropsItem";
import { TypeMeta } from "../../core/ElementMeta";
import { PlusOutlined } from "@ant-design/icons";
import AddElementModal from "../AddElementModal";

interface Props {
  element: PageElement | null;
}



export default function ElementProps({ element }: Props) {
  const ctx = useContext<DesignContext>(PageContext as any);

  const [addVisible, setAddVisible] = useState(false);

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

  function addElement() {
    setAddVisible(true)
  }
  
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
      <div style={{flex: "auto"}}></div>
      <Button type="primary" shape="circle" 
        size="small"
        icon={<PlusOutlined />}
        onClick={addElement}>
      </Button>
    </div>
    <div className="props-content">
      {
        Object
          .entries(commonTypeMeta)
          .map(([prop, meta]) => {
            return <ElementPropsItem
              key={"common_" + prop}
              target={element}
              prop={prop}
              meta={meta}
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
              target={element.props}
              prop={prop}
              meta={meta}
              onValueChange={() => {
                ctx.view.onChange?.();
                ctx.view.pageInfo.changCallback();
              }}
            />;
          })
      }
    </div>

    <AddElementModal 
      visible={addVisible}
      parentId={ctx.view.currentElement?.id!}
      onVisibleChange={v => setAddVisible(v)}
    />
  </div>
}