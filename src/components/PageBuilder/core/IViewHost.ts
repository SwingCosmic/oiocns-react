import { PageBuilderStaticContext } from "..";
import ElementTreeManager from "./ElementTreeManager";

export type HostMode = "design" | "view";

export interface IViewHost<T extends HostMode> extends PageBuilderStaticContext {
  readonly mode: T;
  treeManager: ElementTreeManager;
}

