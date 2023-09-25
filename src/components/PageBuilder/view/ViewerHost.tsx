import React from "react";
import { PageTemplate } from "@/ts/base/pageModel";
import { ViewerPageContext } from "./PageContext";
import { useSignal } from "@/hooks/useSignal";
import { PageContext } from "../render/ViewContext";
import ViewManager from "../render/ViewManager";

export interface ViewerProps {
  page: PageTemplate;
}

export function ViewerHost(props: ViewerProps) {

  const ctx = useSignal<PageContext<"design">>({
    view: new ViewManager("design", props.page)
  });

  return (
    <ViewerPageContext.Provider value={ctx.current}>
      <div className="page-host--view">


      </div>      
    </ViewerPageContext.Provider>
  );
}