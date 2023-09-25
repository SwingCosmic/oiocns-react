import ComponentFactory from "./render/ReactComponentFactory";
import { FC } from "react";


export interface PageBuilderContext {
  factory: ComponentFactory;
}

const elements: Dictionary<FC<any>> = import.meta.glob("./elements/**/*.tsx", { eager: true });

console.log(elements);

const factory = new ComponentFactory();
factory.registerComponents(elements);

export default {
  factory
} as PageBuilderContext;
