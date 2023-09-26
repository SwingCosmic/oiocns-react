
import React, { useContext } from "react";
import { defineElement } from "./defineElement";
import { ViewerPageContext } from "../view/PageContext";


export default defineElement({
  render(props) {
    const ctx = useContext(ViewerPageContext);
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