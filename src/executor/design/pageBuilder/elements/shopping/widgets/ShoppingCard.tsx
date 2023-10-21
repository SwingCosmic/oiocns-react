import { IForm } from '@/ts/core';
import { IBoxProvider } from '@/ts/core/work/box';
import { Modal, Tabs } from 'antd';
import React, { useEffect, useState } from 'react';
import { useThings } from '..';
import CustomStore from 'devextreme/data/custom_store';
import GenerateThingTable from '@/executor/tools/generate/thingTable';
import { command } from '@/ts/base';

interface IProps {
  box: IBoxProvider;
  forms: IForm[];
}

const ShoppingCard: React.FC<IProps> = ({ box, forms }) => {
  const [open, setOpen] = useState(false);
  const things = useThings(box);
  useEffect(() => {
    const id = command.subscribe((type, cmd) => {
      if (type == 'stagings' && cmd == 'open') {
        setOpen(true);
      }
    });
    return () => {
      command.unsubscribe(id);
    };
  });
  return (
    <Modal open={open}>
      <Tabs
        items={forms.map((item) => {
          return {
            key: item.id,
            label: item.name,
            children: (
              <GenerateThingTable
                fields={item.fields}
                height={'70vh'}
                columnChooser={{ enabled: true }}
                selection={{
                  mode: 'multiple',
                  allowSelectAll: true,
                  selectAllMode: 'page',
                  showCheckBoxesMode: 'always',
                }}
                onSelectionChanged={() => {}}
                toolbar={{
                  visible: true,
                  items: [
                    {
                      name: 'add',
                      location: 'after',
                      widget: 'dxButton',
                      options: {
                        text: '发起申领',
                        icon: 'add',
                        onClick: () => {},
                      },
                    },
                    {
                      name: 'columnChooserButton',
                      location: 'after',
                    },
                    {
                      name: 'searchPanel',
                      location: 'after',
                    },
                  ],
                }}
                dataSource={
                  new CustomStore({
                    key: 'id',
                    async load() {
                      return {
                        totalCount: things.length,
                        data: things,
                      };
                    },
                  })
                }
                remoteOperations={true}
              />
            ),
          };
        })}
      />
    </Modal>
  );
};

export default ShoppingCard;
