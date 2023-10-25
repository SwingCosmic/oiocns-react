import { useEffect, useState } from 'react';
import { Context } from '../../render/PageContext';
import { ISpecies } from '@/ts/core';

export const useSpecies = (init: string[], ctx: Context) => {
  const [loading, setLoading] = useState(true);
  const [species, setSpecies] = useState<ISpecies[]>([]);
  const setter = async (init: string[], ctx: Context) => {
    setLoading(true);
    const items = await ctx.view.pageInfo.loadSpecies(init);
    setSpecies(items);
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
    setSpecies: setter,
  };
};
