import { Dictionary } from "lodash";
import { FC } from "react";

const elements: Dictionary<FC<any>> = import.meta.glob("./elements/**/*.tsx", { eager: true });

console.log(elements)