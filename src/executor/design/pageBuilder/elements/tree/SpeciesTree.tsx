import CustomTree from '@/components/CustomTree';
import { buildSpeciesFiledsTree } from '@/executor/open/form/config';
import { FieldModel } from '@/ts/base/model';
import { IForm } from '@/ts/core';
import { generateUuid } from '@/utils/excel';
import { PlusCircleOutlined } from '@ant-design/icons';
import { Modal, Table } from 'antd';
import React, { useState } from 'react';
import { ExistTypeMeta } from '../../core/ElementMeta';
import { defineElement } from '../defineElement';
import { Context } from '../../render/PageContext';

interface IProps {
  species: string[];
  form: IForm;
  ctx: Context;
}

const Design: React.FC<IProps> = (props) => {
  const getSpecies = (): FieldModel[] => {
    return props.form.fields.filter((item) => props.species.includes(item.id));
  };
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(props.species);
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
            dataSource={props.form.fields.filter((item) => item.valueType == '分类型')}
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys: selected,
              onChange: (_, selected) => {
                props.species.splice(0, props.species.length);
                props.species.push(...selected.map((item) => item.id));
                setSpecies(getSpecies());
                setSelected([...props.species]);
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
};

const View: React.FC<IProps> = (props) => {
  return (
    <div style={{ width: 300, padding: 10 }}>
      <CustomTree
        checkable
        searchable
        onCheck={(checked) => {
          props.ctx.view.emitter('speciesTree', 'checked', checked);
        }}
        fieldNames={{ title: 'label', key: 'key', children: 'children' }}
        treeData={buildSpeciesFiledsTree(
          props.form.fields
            .filter((i) => i.valueType === '分类型')
            .filter((i) => props.species.includes(i.id)),
        )}
      />
    </div>
  );
};

export default defineElement({
  render(props, ctx) {
    if (ctx.view.mode == 'design') {
      return <Design {...props} ctx={ctx} />;
    }
    return <View {...props} ctx={ctx} />;
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
