
import React, { useContext } from "react";
import { defineElement } from "./defineElement";
import { PageContext } from "../render/PageContext";


export default defineElement({
  render(props) {
    const ctx = useContext(PageContext);
    const isDesign = ctx.view.mode == "design";

    return (
      <div style={{ height: '100%' }}  
        className={[
          'element-root',
          isDesign ? "is-design" : ""
        ].join(" ")}>

        {isDesign ? <div className="design-tip">
          <div>设计模式</div>
        </div> : <></>}
        {
          props.children.map(c => {
            // 自递归渲染
            const Render = ctx.view.components.getComponentRender(c.kind, ctx.view.mode);
            return <Render key={c.id} element={c}/>;
          })
        }

      </div>
    )
  },
  displayName: "Root",
  meta: {
    props: {

    },
    label: "模板根元素",
  }
})