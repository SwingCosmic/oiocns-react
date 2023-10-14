import { IExistTypeEditor } from './IExistTypeEditor';
import FormProp, { PageProp } from './StandardProp';
import AttrsProp from './AttrsProp';
import { ImagePosition, NormalPosition } from './PositionProp';
import CssSizeEditor from './CssSizeEditor';
import { FormFileProp, PicFileProp } from './FileProp';

const editors: Dictionary<IExistTypeEditor<any, any>> = {
  form: FormProp,
  formFile: FormFileProp,
  picFile: PicFileProp,
  page: PageProp,
  attr: AttrsProp,
  position: NormalPosition,
  size: CssSizeEditor,
  image: ImagePosition,
};

export default editors;
