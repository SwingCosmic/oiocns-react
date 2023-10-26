import CustomTree from '@/components/CustomTree';
import OpenFileDialog from '@/components/OpenFileDialog';
import { IProperty } from '@/ts/core';
import { DeleteOutlined } from '@ant-design/icons';
import { Button, Space, Spin } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { ExistTypeMeta } from '../../core/ElementMeta';
import {
  SpeciesEntity,
  SpeciesNode,
  SpeciesProp,
  loadItems,
} from '../../core/hooks/useSpecies';
import { Context } from '../../render/PageContext';
import { defineElement } from '../defineElement';
import CustomMenu from '@/components/CustomMenu';
import useMenuUpdate from '@/hooks/useMenuUpdate';
import { Controller } from '@/ts/controller';
import { schema } from '@/ts/base';

interface IProps {
  ctx: Context;
  species: SpeciesProp[];
}

const Design: React.FC<IProps> = (props) => {
  const [loading, setLoading] = useState(false);
  const [species, setSpecies] = useState<SpeciesEntity[]>([]);
  const [center, setCenter] = useState(<></>);
  const loadSpecies = async () => {
    setLoading(true);
    setSpecies(await loadItems(props.species, props.ctx));
    setLoading(false);
  };
  useEffect(() => {
    loadSpecies();
  }, []);
  return (
    <Spin spinning={loading}>
      <Space style={{ width: 300, padding: '0 10px' }} direction="vertical">
        <CustomTree
          searchable
          treeData={species}
          titleRender={(node: any) => {
            return (
              <Space align="start">
                <DeleteOutlined
                  onClick={() => {
                    const index = props.species.findIndex((id) => id == node.id);
                    props.species.splice(index, 1);
                    loadSpecies();
                  }}
                />
                {node.name}
              </Space>
            );
          }}
        />
        <Button
          type="dashed"
          size="small"
          onClick={() => {
            setCenter(
              <OpenFileDialog
                accepts={['分类型']}
                rootKey={props.ctx.view.pageInfo.directory.spaceKey}
                excludeIds={props.species.map((item) => item.code)}
                multiple={true}
                onOk={async (files) => {
                  if (files.length > 0) {
                    for (const file of files) {
                      const property = file as IProperty;
                      props.species.push({
                        code: 'T' + property.id,
                        name: property.code + ' ' + property.name,
                        speciesId: property.metadata.speciesId,
                      });
                    }
                    loadSpecies();
                  }
                  setCenter(<></>);
                  return;
                }}
                onCancel={() => setCenter(<></>)}
              />,
            );
          }}>
          添加分类型
        </Button>
        {center}
      </Space>
    </Spin>
  );
};

const buildSpecies = (species: SpeciesEntity[]): SpeciesNode[] => {
  return species.map((item) => {
    item.species.items.forEach((speciesItems) => {
      if (!speciesItems.parentId) {
        speciesItems.parentId = item.species.id;
      }
    });
    const key = item.code + '-' + item.species.id;
    return {
      key: key,
      label: item.name,
      children: buildItems(item.species.items, key),
      itemType: '分类',
      item: item,
    };
  });
};

const buildItems = (items: schema.XSpeciesItem[], parentKey: string) => {
  const prop = parentKey.split('-')[0];
  const result: SpeciesNode[] = [];
  for (const item of items) {
    if (prop + '-' + item.parentId == parentKey) {
      const key = prop + '-' + item.id;
      result.push({
        key: key,
        label: item.name,
        children: buildItems(items, key),
        itemType: '分类项',
        item: item,
      });
    }
  }
  return result;
};

const View: React.FC<IProps> = (props) => {
  const [ctrl] = useState(new Controller('ctrl'));
  const [loading, setLoading] = useState(false);
  const species = useRef<SpeciesEntity[]>([]);
  const loadSpecies = async () => {
    setLoading(true);
    species.current = await loadItems(props.species, props.ctx);
    setLoading(false);
    ctrl.changCallback();
  };
  const [_, rootMenu, selectMenu, setSelectMenu] = useMenuUpdate(() => {
    return {
      key: 'speciesTree',
      label: '分类树',
      itemType: '分类树',
      children: buildSpecies(species.current),
    };
  }, ctrl);
  useEffect(() => {
    loadSpecies();
  }, []);
  if (!selectMenu || !rootMenu) {
    return <></>;
  }
  const parentMenu = selectMenu.parentMenu ?? rootMenu;
  return (
    <Spin spinning={loading}>
      <Space style={{ width: 300, padding: 10 }} direction="vertical">
        <div
          style={{ textAlign: 'center' }}
          title={parentMenu.label}
          onClick={() => {
            setSelectMenu(parentMenu);
            props.ctx.view.emitter(
              'species',
              'checked',
              parentMenu.item?.code ? [parentMenu.item.code] : [],
            );
          }}>
          <span style={{ fontSize: 20, margin: '0 6px' }}>{parentMenu.icon}</span>
          <strong>{parentMenu.label}</strong>
        </div>
        <CustomMenu
          collapsed={false}
          selectMenu={selectMenu}
          item={selectMenu.parentMenu ?? rootMenu}
          onSelect={(node) => {
            setSelectMenu(node);
            if (node.item.code) {
              props.ctx.view.emitter('species', 'checked', [node.item.code]);
            }
          }}
        />
      </Space>
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
