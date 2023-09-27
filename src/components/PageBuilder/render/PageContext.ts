import { createContext } from "react";
import { HostMode } from "../core/IViewHost";
import type HostManagerBase from "./HostManager";


export const PageContext = createContext<IPageContext<HostMode>>({
  view: null!
});

export interface IPageContext<T extends HostMode> {
  view: HostManagerBase<T>;
}