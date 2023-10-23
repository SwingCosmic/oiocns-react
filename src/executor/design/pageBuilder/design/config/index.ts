import { IExistTypeEditor } from './IExistTypeEditor';
import CssSizeEditor from './CssSizeEditor';
import { FormFile, PicFile, PropFile, WorkFile } from './FileProp';
import SlotProp from './SlotProp';

const editors: Dictionary<IExistTypeEditor<any, any>> = {
  formFile: FormFile,
  workFile: WorkFile,
  picFile: PicFile,
  propFile: PropFile,
  size: CssSizeEditor,
  slot: SlotProp,
};

export default editors;
