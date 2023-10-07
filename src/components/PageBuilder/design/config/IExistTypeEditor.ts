import { FC } from "react";


export interface IExistTypeProps<T> {
  value?: T | null;
  onChange?: (value: T | null | undefined) => any;
}

export type IExistTypeEditor<T = string, P extends {} = {}> = FC<IExistTypeProps<T> & P>;