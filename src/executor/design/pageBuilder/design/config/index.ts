import { IExistTypeEditor } from './IExistTypeEditor';
import CssSizeEditor from './CssSizeEditor';
import { Picture, Work } from './FileProp';
import SlotProp from './SlotProp';

const editors: Dictionary<IExistTypeEditor<any, any>> = {
  picFile: Picture,
  workFile: Work,
  size: CssSizeEditor,
  slot: SlotProp,
};

export default editors;
