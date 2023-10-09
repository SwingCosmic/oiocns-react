import { IExistTypeEditor } from "./IExistTypeEditor";
import FormProp, { PageProp } from './StandardProp';
import AttrsProp from './AttrsProp';
import { FieldPositionProp } from './PositionProp';
import CssSizeEditor from "./CssSizeEditor";

const editors: Dictionary<IExistTypeEditor<any, any>> = {
  form: FormProp,
  page: PageProp,
  attr: AttrsProp,
  position: FieldPositionProp,
  size: CssSizeEditor,
};


export default editors;