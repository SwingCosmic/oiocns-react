
import React from "react";
import { defineElement } from "./defineElement";


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

    },
    label: "模板根元素",
  }
})