import CustomTree from '@/components/CustomTree';
import OpenFileDialog from '@/components/OpenFileDialog';
import { schema } from '@/ts/base';
import { ISpecies } from '@/ts/core';
import { DeleteOutlined } from '@ant-design/icons';
import { Button, Space, Spin } from 'antd';
import React, { useState } from 'react';
import { useSpecies } from '../../core/hooks/useSpecies';
import { Context } from '../../render/PageContext';
import { defineElement } from '../defineElement';

interface IProps {
  ctx: Context;
  species: string[];
}

const buildSpecies = (species: ISpecies[]) => {
  return species.map((item) => {
    return {
      key: item.id,
      label: item.name,
      children: buildItems(item.items),
    };
  });
};

const buildItems = (items: schema.XSpeciesItem[], parentId?: string) => {
  const result: any[] = [];
  for (const item of items) {
    if (item.parentId == parentId) {
      result.push({
        key: item.id,
        label: item.name,
        children: buildItems(items, item.id),
      });
    }
  }
  return result;
};

const Design: React.FC<IProps> = (props) => {
  const { loading, species, setSpecies } = useSpecies(props.species, props.ctx);
  const [center, setCenter] = useState(<></>);
  return (
    <Spin spinning={loading}>
      <div style={{ width: 300, height: '100%', padding: '0 10px' }}>
        <Button
          onClick={() => {
            setCenter(
              <OpenFileDialog
                accepts={['分类']}
                rootKey={props.ctx.view.pageInfo.directory.spaceKey}
                excludeIds={species.map((item) => item.id)}
                multiple={true}
                onOk={async (files) => {
                  if (files.length > 0) {
                    for (const file of files) {
                      props.ctx.view.pageInfo.species.push(file as ISpecies);
                      props.species.push(file.id);
                    }
                    setSpecies(props.species, props.ctx);
                  }
                  setCenter(<></>);
                  return;
                }}
                onCancel={() => {
                  setCenter(<></>);
                }}
              />,
            );
          }}>
          新增分类
        </Button>
        <CustomTree
          searchable
          fieldNames={{ title: 'name', key: 'id', children: 'children' }}
          treeData={species}
          titleRender={(node: any) => {
            return (
              <Space align="start">
                <DeleteOutlined
                  onClick={() => {
                    const index = props.species.findIndex((id) => id == node.id);
                    props.species.splice(index, 1);
                    setSpecies(props.species, props.ctx);
                  }}
                />
                {node.name}
              </Space>
            );
          }}
        />
        {center}
      </div>
    </Spin>
  );
};

const View: React.FC<IProps> = (props) => {
  const { loading, species } = useSpecies(props.species, props.ctx);
  return (
    <Spin spinning={loading}>
      <div style={{ width: 300, padding: 10 }}>
        <CustomTree
          checkable
          searchable
          onCheck={(checked) => {
            props.ctx.view.emitter('speciesTree', 'checked', checked);
          }}
          fieldNames={{ title: 'label', key: 'key', children: 'children' }}
          treeData={buildSpecies(species)}
        />
      </div>
    </Spin>
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
    },
  },
});
