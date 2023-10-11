import { IExistTypeEditor } from './IExistTypeEditor';
import FormProp, { PageProp } from './StandardProp';
import AttrsProp from './AttrsProp';
import { ImagePosition, NormalPosition } from './PositionProp';
import CssSizeEditor from './CssSizeEditor';
import { FormFileProp } from './FileProp';

const editors: Dictionary<IExistTypeEditor<any, any>> = {
  form: FormProp,
  formFile: FormFileProp,
  page: PageProp,
  attr: AttrsProp,
  position: NormalPosition,
  size: CssSizeEditor,
  image: ImagePosition,
};

export default editors;
