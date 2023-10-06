import { IExistTypeEditor } from "./IExistTypeEditor";
import FormProp, { PageProp } from './StandardProp';
import AttrsProp from './AttrsProp';
import { FieldPositionProp } from './PositionProp';

const editors: Dictionary<IExistTypeEditor<any, any>> = {
  form: FormProp,
  page: PageProp,
  attr: AttrsProp,
  position: FieldPositionProp,
};


export default editors;