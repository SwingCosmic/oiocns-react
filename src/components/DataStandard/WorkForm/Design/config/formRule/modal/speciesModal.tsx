import React, { useEffect, useState } from 'react';
import { Modal } from 'antd';
import { TextArea, TextBox } from 'devextreme-react';
import { schema } from '@/ts/base';
import { getUuid } from '@/utils/tools';
import { FieldInfo } from 'typings/globelType';
import SpeciesTags from '../filter/tags/speciesTags';

interface IProps {
  fields: (FieldInfo & { fieldType?: string })[];
  current?: schema.XSpeciesFilter;
  onOk: (rule: schema.XSpeciesFilter) => void;
  onCancel: () => void;
}

const SpeciesModal: React.FC<IProps> = (props) => {
  const [name, setName] = useState<string>();
  const [remark, setRemark] = useState<string>();
  const [speciesList, setSpeciesList] = useState<any>([]);

  useEffect(() => {
    if (props.current) {
      setName(props.current.name);
      setRemark(props.current.remark);
      setSpeciesList(props.current.speciesList);
    }
  }, [props.current]);

  const vaildDisable = () => {
    return speciesList == undefined || speciesList.length < 1 || name == '' || !name;
  };
  return (
    <Modal
      destroyOnClose
      title={'添加类筛选'}
      open={true}
      onOk={() => {
        props.onOk.apply(this, [
          {
            id: props.current?.id ?? getUuid(),
            name: name!,
            remark: remark ?? '',
            speciesList: speciesList,
            speciesName: speciesList.map((item: { name: any }) => item.name).join(),
          },
        ]);
      }}
      onCancel={props.onCancel}
      okButtonProps={{
        disabled: vaildDisable(),
      }}>
      <TextBox
        label="筛选名称*"
        labelMode="floating"
        value={name}
        onValueChange={(e) => {
          setName(e);
        }}
      />

      <SpeciesTags
        fields={props.fields.filter((a) => a.fieldType === '分类型')}
        speciesList={speciesList}
        onValueChanged={(value) => {
          setSpeciesList(value);
        }}
      />

      <TextArea
        label="备注"
        labelMode="floating"
        onValueChanged={(e) => {
          setRemark(e.value);
        }}
        value={remark}
      />
    </Modal>
  );
};
export default SpeciesModal;
