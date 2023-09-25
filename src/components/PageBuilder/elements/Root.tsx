
import React from "react";
import { defineElement } from "./defineElement";
import { ExistTypeMeta } from "../core/ElementMeta";
import { PageElement } from "../core/PageElement";


export default defineElement({
  render(props, ctx) {
    return <div className="root">
      {
        props.children.map(c => {
          // 自递归渲染
          const Render = ctx.view.components.getComponentRender(c.kind);
          return <Render key={c.id} element={c}/>;
        })
      }
    </div>
  },
  displayName: "Root",
  meta: {
    props: {
      children: {
        type: "array",
        elementType: {
          type: "type",
          typeName: "PageElement"
        } as ExistTypeMeta<PageElement>
      }
    }
  }
})