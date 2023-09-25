

export interface IPageTemplate<T extends string> {
  kind: T;
  data: string;
  // 其他属性通过模块补充增加
}


export interface ShopTemplate extends IPageTemplate<"shop"> {

}
export interface NewsTemplate extends IPageTemplate<"news"> {

}

export interface PageTemplatePresetMap {
  "shop": ShopTemplate;
  "news": NewsTemplate;
}

export type PageTemplatePreset = PageTemplatePresetMap[keyof PageTemplatePresetMap];

/** 类型保护，判断一个模板是不是内置模板 */
export function isPageTemplatePreset(template: PageTemplate): template is PageTemplatePreset {
  return ["shop", "news"].includes(template.kind);
}

export type PageTemplate<T extends string = string> =  T extends keyof PageTemplatePresetMap
  ? PageTemplatePresetMap[T]
  : IPageTemplate<T>;