
import React from "react";
import { defineElement } from "./defineElement";


export default defineElement({
  render(props, ctx) {
    return <div className="root">
      {props.test2}
    </div>
  },
  displayName: "Root",
  meta: {
    props: {
      test: {
        type: "string",
        label: "字符串"
      },
      test2: {
        type: "array",
        label: "数组",
        elementType: {
          type: "number",
        }
      }
    }
  }
})