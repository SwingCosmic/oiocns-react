import { useEffect, useState } from 'react';
import { Context } from '../../render/PageContext';
import { ISpecies } from '@/ts/core';
import { schema } from '@/ts/base';

export type SpeciesProp = { id: string; name: string; speciesId: string };
export type SpeciesEntity = { id: string; name: string; species: ISpecies };
export type SpeciesNode = {
  key: string;
  label: string;
  children: SpeciesNode[];
  item: any;
  items: schema.XSpeciesItem[];
};

const buildSpecies = (species: SpeciesEntity[]): SpeciesNode[] => {
  return species.map((item) => {
    item.species.items.forEach((speciesItems) => {
      if (!speciesItems.parentId) {
        speciesItems.parentId = item.species.id;
      }
    });
    return {
      key: item.id + '-' + item.species.id,
      label: item.name,
      children: [],
      item: item,
      items: item.species.items,
    };
  });
};

export const buildItems = (items: schema.XSpeciesItem[], parent: SpeciesNode) => {
  const propId = parent.key.split('-')[0];
  for (const item of items) {
    if (propId + '-' + item.parentId == parent.key) {
      parent.children.push({
        key: propId + '-' + item.id,
        label: item.name,
        children: [],
        item: item,
        items: items,
      });
    }
  }
};

export const search = (tree: SpeciesNode[], id: string): SpeciesNode | undefined => {
  for (const item of tree) {
    if (item.key == id) {
      return item;
    }
    const node = search(item.children, id);
    if (node) {
      return node;
    }
  }
};

export const useSpecies = (init: SpeciesProp[], ctx: Context) => {
  const [loading, setLoading] = useState(true);
  const [species, setSpecies] = useState<SpeciesEntity[]>([]);
  const [tree, setTree] = useState<SpeciesNode[]>([]);
  const setter = async (init: SpeciesProp[], ctx: Context) => {
    setLoading(true);
    const items = await ctx.view.pageInfo.loadSpecies(init.map((item) => item.speciesId));
    const result: SpeciesEntity[] = [];
    for (const prop of init) {
      const find = items.find((item) => item.id == prop.speciesId);
      if (find) {
        result.push({
          id: prop.id,
          name: prop.name,
          species: find,
        });
      }
    }
    setSpecies(result);
    setTree(buildSpecies(result));
    for (const item of items) {
      await item.loadContent();
    }
    setLoading(false);
  };
  useEffect(() => {
    setter(init, ctx);
  }, []);
  return {
    loading,
    species,
    tree,
    setTree,
    setSpecies: setter,
  };
};
