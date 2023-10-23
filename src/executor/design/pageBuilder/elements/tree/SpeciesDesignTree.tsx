import CustomTree from '@/components/CustomTree';
import { FieldModel } from '@/ts/base/model';
import { IForm } from '@/ts/core';
import { generateUuid } from '@/utils/excel';
import { PlusCircleOutlined } from '@ant-design/icons';
import { Modal } from 'antd';
import React, { useState } from 'react';
import { ExistTypeMeta } from '../../core/ElementMeta';
import { defineElement } from '../defineElement';

export default defineElement({
  render(props) {
    const getSpecies = (): FieldModel[] => {
      return [
        ...props.form.fields.filter((item) => props.species.includes(item.id)),
        {
          id: generateUuid(),
          name: '虚拟节点',
          code: 'virtually',
          valueType: '虚拟',
          remark: '虚拟节点',
        },
      ];
    };
    const [open, setOpen] = useState(false);
    const [species] = useState<FieldModel[]>(getSpecies());
    return (
      <div>
        <CustomTree
          searchable
          titleRender={(node: any) => {
            if (node.valueType == '虚拟') {
              return (
                <PlusCircleOutlined
                  style={{ color: 'green' }}
                  onClick={() => setOpen(true)}
                />
              );
            }
            return node.name;
          }}
          treeData={species}
        />
        <Modal
          open={open}
          onOk={() => setOpen(false)}
          onCancel={() => setOpen(false)}
          cancelButtonProps={{ hidden: true }}></Modal>
      </div>
    );
  },
  displayName: 'SpeciesTree',
  meta: {
    type: 'Element',
    label: '分类树',
    props: {
      species: {
        type: 'array',
        label: '分类数组',
        elementType: {
          type: 'string',
          label: '分类',
        },
        default: [],
      },
      form: {
        type: 'type',
        typeName: 'form',
        hidden: true,
      } as ExistTypeMeta<IForm>,
    },
  },
});
