import { HostMode } from "./ViewHost";
import ViewManager from "./ViewManager";

export interface PageContext<T extends HostMode> {
  view: ViewManager<T>;
}