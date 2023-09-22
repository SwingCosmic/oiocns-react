export interface PageElement<T = any> {
  id: string;
  kind: string;
  name: string;
  data?: T;
  children: PageElement[];
}



declare module "@/ts/base/pageModel" {
  interface IPageTemplate<T extends string> {

    elements: PageElement[];
  }
}