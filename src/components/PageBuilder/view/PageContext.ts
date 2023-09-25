import { createContext, useContext } from "react";
import { PageContext } from "../render/ViewContext";


export const ViewerPageContext = createContext<PageContext<"design">>({
  view: null!
});
