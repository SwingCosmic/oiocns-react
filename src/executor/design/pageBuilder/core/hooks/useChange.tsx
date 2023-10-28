import { command } from '@/ts/base';
import { IBoxProvider } from '@/ts/core/work/box';
import { useState, useEffect } from 'react';

export const useStagings = (box: IBoxProvider) => {
  const [stagings, setStagings] = useState(box.groups(['实体']));
  useEffect(() => {
    const id = command.subscribe((type, cmd) => {
      switch (type) {
        case 'stagings':
          switch (cmd) {
            case 'refresh':
              setStagings(box.groups(['实体']));
              break;
          }
          break;
      }
    });
    return () => {
      command.unsubscribe(id);
    };
  });
  return stagings;
};
