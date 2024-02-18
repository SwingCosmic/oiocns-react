import { schema } from '@/ts/base';
import { IForm, IProperty, orgAuth } from '@/ts/core';
import { List } from 'devextreme-react';
import { Button } from 'antd';
import React from 'react';
import OpenFileDialog from '@/components/OpenFileDialog';
import Toolbar, { Item } from 'devextreme-react/toolbar';
import FormItem from './formItem';
import { ItemDragging } from 'devextreme-react/list';
import { Emitter } from '@/ts/base/common';
import message from '@/utils/message';

const FormRender: React.FC<{
  current: IForm;
  notityEmitter: Emitter;
  onItemSelected: (index: number) => void;
}> = ({ current, notityEmitter, onItemSelected }) => {
  if (current.metadata.attributes === undefined) {
    current.metadata.attributes = [];
  }
  const [openDialog, setDialog] = React.useState(false);
  const showDialog = React.useCallback(() => setDialog(true), []);
  const onReorder = React.useCallback((e: { fromIndex: number; toIndex: number }) => {
    const fromAttr = current.metadata.attributes.splice(e.fromIndex, 1);
    current.metadata.attributes.splice(e.toIndex, 0, ...fromAttr);
  }, []);

  async function updateProperties() {
    await current.directory.standard.updateFormProperties([current.metadata]);
    message.info("更新成功")
  }
  return (
    <div style={{ padding: 16 }}>
      <Toolbar height={60}>
        <Item
          location="center"
          locateInMenu="never"
          render={() => (
            <div className="toolbar-label">
              <b style={{ fontSize: 20 }}>{current.name}</b>
            </div>
          )}
        />
        <Item
          location="after"
          locateInMenu="never"
          render={() => (
            <Button type="primary" onClick={showDialog}>
              + 添加属性
            </Button>
          )}
        />
        <Item
          location="after"
          locateInMenu="never"
          render={() => (
            <Button onClick={updateProperties}>
              更新特性的属性信息
            </Button>
          )}
        />
      </Toolbar>
      <div
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <List<schema.XAttribute, string>
          itemKeyFn={(attr: schema.XAttribute) => attr.id}
          dataSource={current.metadata.attributes}
          height={'calc(100vh - 190px)'}
          width={'72%'}
          searchEnabled
          scrollingEnabled
          searchMode="contains"
          focusStateEnabled={false}
          activeStateEnabled={false}
          pageLoadMode="scrollBottom"
          searchExpr={['name', 'remark']}
          scrollByContent={false}
          allowItemDeleting
          onItemClick={(e) => {
            e.event?.stopPropagation();
            if (e.itemData) {
              const index = current.metadata.attributes.findIndex(
                (i) => i.id === e.itemData?.id,
              );
              if (index > -1) {
                onItemSelected(index);
                return;
              }
            }
            onItemSelected(e.itemIndex as number);
          }}
          onItemReordered={onReorder}
          onItemDeleted={() => onItemSelected(-1)}
          itemRender={(attr: schema.XAttribute) => {
            return (
              <FormItem attr={attr} current={current} notityEmitter={notityEmitter} />
            );
          }}
          itemDeleteMode="static">
          <ItemDragging
            data={current.metadata.attributes}
            autoScroll
            allowReordering
            dropFeedbackMode="push"
            dragDirection="vertical"
            bindingOptions={{
              location: 'before',
            }}
          />
        </List>
      </div>
      {openDialog && (
        <OpenFileDialog
          multiple
          title={`选择属性`}
          accepts={['属性']}
          rootKey={current.spaceKey}
          excludeIds={current.attributes.filter((i) => i.propId).map((a) => a.propId)}
          onCancel={() => setDialog(false)}
          onOk={(files) => {
            (files as IProperty[]).forEach((item) => {
              current.metadata.attributes.push({
                propId: item.id,
                property: item.metadata,
                ...item.metadata,
                rule: '{}',
                options: {
                  visible: true,
                  isRequired: true,
                },
                formId: current.id,
                authId: orgAuth.SuperAuthId,
              });
            });
            setDialog(false);
          }}
        />
      )}
    </div>
  );
};

export default FormRender;
