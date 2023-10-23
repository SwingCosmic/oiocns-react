import WorkStartDo from '@/executor/open/work';
import { command } from '@/ts/base';
import { IBoxProvider } from '@/ts/core/work/box';
import React from 'react';
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

export const useCenter = () => {
  const [center, setCenter] = useState(<></>);
  useEffect(() => {
    const id = command.subscribe((type, cmd) => {
      switch (type) {
        case 'work':
          switch (cmd) {
            case 'start':
              {
                setCenter(
                  <WorkStartDo
                    current={undefined as any}
                    finished={() => setCenter(<></>)}
                  />,
                );
              }
              break;
          }
          break;
      }
    });
    return () => {
      command.unsubscribe(id);
    };
  });
  return center;
};
