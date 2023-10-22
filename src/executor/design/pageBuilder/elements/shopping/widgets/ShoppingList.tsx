import { IForm } from '@/ts/core';
import { IBoxProvider } from '@/ts/core/work/box';
import { Modal, Tabs } from 'antd';
import React, { useEffect, useState } from 'react';
import CustomStore from 'devextreme/data/custom_store';
import GenerateThingTable from '@/executor/tools/generate/thingTable';
import { command } from '@/ts/base';
import { useStagings } from '../useChange';

interface IProps {
  box: IBoxProvider;
  forms: IForm[];
}

const ShoppingList: React.FC<IProps> = ({ box, forms }) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any[]>([]);
  const stagings = useStagings(box);
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
    <Modal
      open={open}
      width={'80vw'}
      cancelButtonProps={{ hidden: true }}
      okText={'关闭'}
      onCancel={() => setOpen(false)}
      onOk={() => setOpen(false)}>
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
                selectedRowKeys={selected}
                onSelectedRowKeysChange={setSelected}
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
                      name: 'delete',
                      location: 'after',
                      widget: 'dxButton',
                      options: {
                        text: '删除物品',
                        icon: 'add',
                        onClick: () => {
                          box.removeStaging(
                            stagings.filter((item) => selected.includes(item.dataId)),
                          );
                        },
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
                    async load(options) {
                      const skip = options.skip ?? 0;
                      const take = options.take ?? 20;
                      return {
                        totalCount: stagings.length,
                        data: stagings.slice(skip, skip + take).map((item) => item.data),
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

export default ShoppingList;
