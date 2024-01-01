import * as i from '../impl';
import * as t from '../type';

export class AnySheet extends i.BaseSheet<t.schema.XThing> {
  constructor(id: string, name: string, columns: t.model.Column[]) {
    super(id, name, columns);
  }
}

export class AnyHandler extends i.SheetHandler<AnySheet> {
  checkData(_: t.IExcel): t.Error[] {
    return [];
  }
  async operating(_: t.IExcel, __: () => void): Promise<void> {
    return;
  }
}
