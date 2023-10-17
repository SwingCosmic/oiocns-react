/* eslint-disable no-unused-vars */
/* prettier-ignore */


type LastInUnion<U> = UnionToIntersection<
  U extends unknown ? (x: U) => 0 : never
> extends (x: infer L) => 0
  ? L
  : never;

declare global {
  interface Dictionary<T> {
    [key: string]: T;
  }

  interface AnyFunction {
    (...args: any[]): any;
  }

  type AnyKey = keyof any;

  interface Constructor<T> {
    new (...args: any[]): T;
  }

  /** vue源码方案，将联合类型转成交叉类型 */
  type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

  /** github高星方案，将联合类型转元组 */
  type UnionToTuple<U, Last = LastInUnion<U>> = [U] extends [never]
    ? []
    : [...UnionToTuple<Exclude<U, Last>>, Last];

}

export {};
