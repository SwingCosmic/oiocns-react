import CustomTree from '@/components/CustomTree';
import OpenFileDialog from '@/components/OpenFileDialog';
import { IProperty } from '@/ts/core';
import { DeleteOutlined } from '@ant-design/icons';
import { Button, Space, Spin } from 'antd';
import React, { useState } from 'react';
import { ExistTypeMeta } from '../../core/ElementMeta';
import { SpeciesProp, buildItems, search, useSpecies } from '../../core/hooks/useSpecies';
import { Context } from '../../render/PageContext';
import { defineElement } from '../defineElement';

interface IProps {
  ctx: Context;
  species: SpeciesProp[];
}

const Design: React.FC<IProps> = (props) => {
  const { loading, species, setSpecies } = useSpecies(props.species, props.ctx);
  const [center, setCenter] = useState(<></>);
  return (
    <Spin spinning={loading}>
      <Space style={{ width: 300, padding: '0 10px' }} direction="vertical">
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
        <Button
          onClick={() => {
            setCenter(
              <OpenFileDialog
                accepts={['分类型']}
                rootKey={props.ctx.view.pageInfo.directory.spaceKey}
                excludeIds={props.species.map((item) => item.id)}
                multiple={true}
                onOk={async (files) => {
                  if (files.length > 0) {
                    for (const file of files) {
                      const property = file as IProperty;
                      props.species.push({
                        id: 'T' + property.id,
                        name: property.code + ' ' + property.name,
                        speciesId: property.metadata.speciesId,
                      });
                    }
                    setSpecies(props.species, props.ctx);
                  }
                  setCenter(<></>);
                  return;
                }}
                onCancel={() => setCenter(<></>)}
              />,
            );
          }}>
          新增分类
        </Button>
        {center}
      </Space>
    </Spin>
  );
};

const View: React.FC<IProps> = (props) => {
  const { loading, tree, setTree } = useSpecies(props.species, props.ctx);
  return (
    <Spin spinning={loading}>
      <div style={{ width: 300, padding: 10 }}>
        <CustomTree
          checkable
          searchable
          loadData={async (props) => {
            const node = search(tree, props.key as string);
            if (node) {
              buildItems(node.items, node);
              setTree([...tree]);
            }
          }}
          onCheck={(checked) => {
            const userData = new Set<string>();
            for (const item of checked as string[]) {
              const split = item.split('-');
              if (split.length == 2) {
                userData.add(split[0]);
              } else if (split.length == 3) {
                userData.add(split[0]);
                userData.add(split[2]);
              }
            }
            props.ctx.view.emitter('speciesTree', 'checked', [...userData]);
          }}
          fieldNames={{ title: 'label', key: 'key', children: 'children' }}
          treeData={tree}
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
          type: 'type',
          label: '分类',
        } as ExistTypeMeta<SpeciesProp>,
        default: [],
      },
    },
  },
});
