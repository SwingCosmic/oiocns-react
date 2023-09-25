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

  const ctx = useSignal<PageContext<"view">>({
    view: new ViewManager("view", props.page)
  });

  const RootRender = ctx.current.view.components.rootRender as any;
  
  return (
    <ViewerPageContext.Provider value={ctx.current}>
      <div className="page-host--view" style={{height: "100%",width: "100%"}}>
        <RootRender 
          element={props.page.rootElement}>

        </RootRender>
      </div>      
    </ViewerPageContext.Provider>
  );
}