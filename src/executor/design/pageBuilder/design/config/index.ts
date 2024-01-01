import { IExistTypeEditor } from './IExistTypeEditor';
import CssSizeEditor from './CssSizeEditor';
import { Form, Picture, Work, Species, Property } from './FileProp';
import SlotProp from './SlotProp';

const editors: Dictionary<IExistTypeEditor<any, any>> = {
  picFile: Picture,
  workFile: Work,
  formFile: Form,
  speciesFile: Species,
  propertyFile: Property,
  size: CssSizeEditor,
  slot: SlotProp,
};

export default editors;
