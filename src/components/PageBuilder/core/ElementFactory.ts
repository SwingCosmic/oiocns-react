import { getUuid } from "@/utils/tools";
import { ElementInit } from "./ElementTreeManager";
import { PageElement } from "@/components/PageBuilder/core/PageElement";

export default class ElementFactory {
  // TODO: 注册和解析元素属性元数据，包括默认值和校验
  readonly elementPropsMeta: Dictionary<any> = {};
  
  create<E extends PageElement>(kind: E["kind"], name: string, params: ElementInit<E> = {}): E {
    const e: E = {
      id: getUuid(),
      kind,
      name,
      ...params
    } as any;
    e.props ||= {};
    return e;
  }
}