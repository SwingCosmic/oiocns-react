import React, { useEffect, useState } from 'react';
import { Field } from 'devextreme/ui/filter_builder';
import { DropDownBox, TreeView } from 'devextreme-react';
import { schema } from '@/ts/base';
import { FiledLookup } from '@/ts/base/model';
import message from '@/utils/message';

interface IProps {
  fields: Field[];
  speciesList: [];
  onValueChanged: (v: schema.XTagFilter[]) => void;
}

const SpeciesTags: React.FC<IProps> = ({ fields, speciesList, onValueChanged }) => {
  const [opened, setOpened] = useState<boolean>(false);
  const [selectSpecies, setSelectSpecies] = useState<FiledLookup[]>();
  const [speciesSource, setSpeciesSource] = useState<FiledLookup[]>();
  useEffect(() => {
    const source: FiledLookup[] = [];
    fields.forEach((a) => {
      const children = a.lookup?.dataSource as FiledLookup[];
      if (children) {
        source.push(
          ...children.map((s) => {
            return { ...s, parentId: s.parentId ?? a.dataField, rootText: a.caption };
          }),
        );
      }
      source.push({ id: a.dataField!, text: a.caption!, value: 'S' + a.dataField });
    });
    const _source = source.filter((s, i) => source.findIndex((d) => d.id === s.id) === i);
    setSpeciesSource(_source);
  }, [fields]);

  useEffect(() => {
    setSelectSpecies(speciesList);
  }, [speciesList]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'nowrap',
        gap: 10,
      }}>
      <DropDownBox
        width={'90%'}
        opened={opened}
        label="分类*"
        labelMode="floating"
        value={selectSpecies?.map((a) => a.id)}
        displayExpr="text"
        valueExpr="id"
        showClearButton={true}
        dataSource={speciesSource}
        onOptionChanged={(e) => {
          if (e.name === 'opened') {
            setOpened(e.value);
          }
        }}
        contentRender={() => {
          return (
            <TreeView
              keyExpr="id"
              displayExpr="text"
              dataStructure="plain"
              selectionMode="single"
              parentIdExpr="parentId"
              showCheckBoxesMode="normal"
              onItemClick={() => setOpened(false)}
              selectByClick={true}
              selectNodesRecursive={false}
              dataSource={speciesSource}
              onItemSelectionChanged={(e) => {
                const ss = e.component.getSelectedNodes();
                const arr = ss.map((a) => a.itemData) as FiledLookup[];
                if (arr.length > 0 && !arr[0].parentId) {
                  message.warn('第一层分类节点不可选择');
                  return false;
                }
                setSelectSpecies(arr);
                if (arr?.length > 0) {
                  onValueChanged(
                    arr.map((s) => {
                      var name = 'rootText' in s ? `[${s.rootText}]${s.text}` : s.text;
                      return {
                        id: s.id,
                        typeName: '分类',
                        name: name,
                        code: s.value,
                        value: s.value,
                      };
                    }),
                  );
                }
              }}
            />
          );
        }}
      />
    </div>
  );
};

export default SpeciesTags;
