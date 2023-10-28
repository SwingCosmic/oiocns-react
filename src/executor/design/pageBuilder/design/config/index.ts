import { IExistTypeEditor } from './IExistTypeEditor';
import CssSizeEditor from './CssSizeEditor';
import { Picture } from './FileProp';
import SlotProp from './SlotProp';

const editors: Dictionary<IExistTypeEditor<any, any>> = {
  picFile: Picture,
  size: CssSizeEditor,
  slot: SlotProp,
};

export default editors;
