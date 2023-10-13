/* eslint-disable prettier/prettier */
/* prettier-ignore */
/** 不要改动此文件 */

export type PrimitiveType = 'string' | 'number' | 'boolean' | 'date';
export type ComplexType = 'enum' | 'array' | 'object' | 'type';
export type DataType = PrimitiveType | ComplexType;

export interface TypeMetaBase<T extends DataType> {
  type: T;
  default?: any;
  required?: boolean;
  label?: string;
  readonly?: boolean;
}

export interface PrimitiveTypeMeta<T extends PrimitiveType> extends TypeMetaBase<T> {}

export interface EnumItem<V = any> {
  label: string;
  value: V;
}

export interface EnumTypeMeta<V = any> extends TypeMetaBase<'enum'> {
  options: EnumItem<V>[];
}

export interface ArrayTypeMeta extends TypeMetaBase<'array'> {
  elementType: TypeMeta;
}
export interface ObjectTypeMeta extends TypeMetaBase<'object'> {
  properties: Dictionary<TypeMeta>;
}

// 泛型 T 用来启用类型推导，不能去除
// @ts-ignore
// eslint-disable-next-line no-unused-vars
export interface ExistTypeMeta<T, C extends {} = Dictionary<any>>
  extends TypeMetaBase<'type'> {
  typeName: string;
  editorConfig?: C;
}

export type TypeMeta =
  | PrimitiveTypeMeta<PrimitiveType>
  | EnumTypeMeta<string | number>
  | ArrayTypeMeta
  | ObjectTypeMeta
  | ExistTypeMeta<any>;

export interface ElementMeta {
  /** 定义属性的类型 */
  props: Dictionary<TypeMeta>;
  /** 组件中文名 */
  label: string;
  /** 是否有 Children */
  hasChildren: boolean;
}

/**
 * 类型体操，设计时解出一个`TypeMeta`字面量对应的数据类型
 */
export type ExtractToType<T extends TypeMeta> = 
  T["type"] extends "string" ? string :
  T["type"] extends "number" ? number :
  T["type"] extends "boolean" ? boolean :
  T["type"] extends "date" ? string :
  T extends EnumTypeMeta<infer R> ? R :
  T extends ArrayTypeMeta ? ExtractToType<T["elementType"]>[] :
  T extends ObjectTypeMeta ? {
    [P in keyof T["properties"]]: ExtractToType<T["properties"][P]>
  } : 
  T extends ExistTypeMeta<infer R> ? R :
  any;

export type ExtractMetaToType<T extends ElementMeta> = {
  [P in keyof T['props']]: ExtractToType<T['props'][P]>;
};
