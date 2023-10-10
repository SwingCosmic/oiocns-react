

export interface DataContext<T extends string = string> {
  code: string;
  name: string;
  kind: T;
  thingId: string;
}

declare module "@/ts/base/pageModel" {
  interface IPageTemplate<T extends string> {
    data?: DataContext[];
  }
}