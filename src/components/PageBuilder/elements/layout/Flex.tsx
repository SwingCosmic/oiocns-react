import React from "react";
import { defineElement } from "../defineElement";
import { EnumTypeMeta } from "../../core/ElementMeta";
import { Globals, Property } from "csstype";
import _ from "lodash";
import "./index.less";

type SelfValue<T extends string> = Exclude<T, Globals>

export default defineElement({
  render(props, ctx) {
    const isDesign = ctx.view.mode == "design";
    const style = {
      ..._.omit(props, ["style", "className", "children"]),
      ...props.style,
    };

    return (
      <div 
        className={[
          'element-layout-flex',
          isDesign ? "is-design" : ""
        ].join(" ")} 
        style={style}>
        {
          props.children.map(c => {
            const Render = ctx.view.components.getComponentRender(c.kind, ctx.view.mode);
            return <Render key={c.id} element={c}/>;
          })
        }
      </div>
    )
  },
  displayName: "Flex",
  meta: {
    label: "Flex面板",
    props: {
      flexDirection: {
        type: "enum",
        label: "主轴方向",
        options: [
          { label: "从左到右", value: "row" },
          { label: "从右到左", value: "row-reverse" },
          { label: "从上到下", value: "column" },
          { label: "从下到上", value: "column-reverse" },
        ],
        default: "row",
      } as EnumTypeMeta<SelfValue<Property.FlexDirection>>,
      justifyContent: {
        type: "enum",
        label: "主轴对齐",
        options: [
          { label: "对齐开头", value: "flex-start" },
          { label: "居中", value: "center" },
          { label: "对齐结尾", value: "flex-end" },
          { label: "撑满", value: "stretch" },
          { label: "内侧间距", value: "space-between" },
          { label: "外侧间距", value: "space-around" },
        ],
        default: "flex-start",
      } as EnumTypeMeta<SelfValue<Property.JustifyContent>>,
      alignItems: {
        type: "enum",
        label: "次轴对齐",
        options: [
          { label: "对齐开头", value: "flex-start" },
          { label: "居中", value: "center" },
          { label: "对齐结尾", value: "flex-end" },
          { label: "撑满", value: "stretch" },
          { label: "基线", value: "baseline" },
        ],
        default: "stretch",
      } as EnumTypeMeta<SelfValue<Property.AlignItems>>,
      height: {
        type: "string",
        label: "高度",
        default: "auto"
      },
      padding: {
        type: "string",
        label: "内边距",
        default: "16px"
      },
      gap: {
        type: "string",
        label: "子元素间距",
        default: "16px"
      },
    }
  }
})