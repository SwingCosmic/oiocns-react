import GenerateThingTable from '@/executor/tools/generate/thingTable';
import { command, model } from '@/ts/base';
import { IBoxProvider } from '@/ts/core/work/box';
import { Modal } from 'antd';
import CustomStore from 'devextreme/data/custom_store';
import React, { useEffect, useState } from 'react';
import { useStagings } from '../../../core/hooks/useChange';

interface IProps {
  box: IBoxProvider;
  fields: model.FieldModel[];
}

const ShoppingList: React.FC<IProps> = ({ box, fields }) => {
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
  }, []);
  return (
    <Modal
      open={open}
      width={'80vw'}
      cancelButtonProps={{ hidden: true }}
      okText={'关闭'}
      onCancel={() => setOpen(false)}
      onOk={() => setOpen(false)}>
      <GenerateThingTable
        fields={fields}
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
                onClick: async () => {},
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
        hideColumns={[
          'createTime',
          'createUser',
          'createUser',
          'updateTime',
          'chainId',
          'code',
        ]}
        remoteOperations={true}
      />
    </Modal>
  );
};

export default ShoppingList;
