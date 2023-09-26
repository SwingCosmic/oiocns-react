import { createContext } from "react";
import { HostMode } from "../core/IViewHost";
import type ViewManager from "./ViewManager";


export const PageContext = createContext<IPageContext<HostMode>>({
  view: null!
});

export interface IPageContext<T extends HostMode> {
  view: ViewManager<T>;
}