import CustomTree from '@/components/CustomTree';
import { FieldModel } from '@/ts/base/model';
import { IForm } from '@/ts/core';
import { PlusCircleOutlined } from '@ant-design/icons';
import { Modal, Table } from 'antd';
import React, { useState } from 'react';
import { ExistTypeMeta } from '../../core/ElementMeta';
import { defineElement } from '../defineElement';
import { generateUuid } from '@/utils/excel';

export default defineElement({
  render(props) {
    const getSpecies = (): FieldModel[] => {
      return props.form.fields.filter((item) => props.species.includes(item.id));
    };
    const [open, setOpen] = useState(false);
    const [species, setSpecies] = useState<FieldModel[]>(getSpecies());
    return (
      <div style={{ width: 300, padding: '0 10px' }}>
        <CustomTree
          searchable
          fieldNames={{ title: 'name', key: 'id', children: 'children' }}
          onSelect={(_, item) => {
            if ((item.node as any).valueType == '虚拟') {
              setOpen(true);
              return;
            }
          }}
          treeData={[
            ...species,
            {
              id: generateUuid(),
              name: <PlusCircleOutlined />,
              code: 'virtually',
              valueType: '虚拟',
              remark: '虚拟节点',
            },
          ]}
        />
        <Modal
          open={open}
          onOk={() => setOpen(false)}
          onCancel={() => setOpen(false)}
          cancelButtonProps={{ hidden: true }}>
          <div style={{ padding: 10 }}>
            <Table
              dataSource={props.form.fields}
              rowSelection={{
                type: 'checkbox',
                onChange: (_, selected) => {
                  props.species.splice(0, props.species.length);
                  props.species.push(...selected.map((item) => item.id));
                  setSpecies(getSpecies());
                },
              }}
              rowKey={'id'}
              columns={[
                {
                  title: '分类名称',
                  dataIndex: 'name',
                },
                {
                  title: '分类编码',
                  dataIndex: 'code',
                },
              ]}
            />
          </div>
        </Modal>
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
