import * as t from '../type';

/**
 * Sheet 表抽象的基类
 */
export class BaseSheet<T> implements t.model.Sheet<T> {
  id: string;
  name: string;
  columns: t.model.Column[];
  data: T[];

  constructor(id: string, name: string, columns: t.model.Column[]) {
    this.id = id;
    this.name = name;
    this.columns = columns;
    this.data = [];
  }
}

/**
 * Sheet 表抽象的默认实现
 */
export class Sheet<T> extends BaseSheet<T> {
  dir: t.IDirectory;

  constructor(id: string, name: string, columns: t.model.Column[], dir: t.IDirectory) {
    super(id, name, columns);
    this.dir = dir;
  }
}
