import { IForm } from '@/ts/core';
import React from 'react';
import Toolbar, { Item } from 'devextreme-react/toolbar';
import { Emitter } from '@/ts/base/common';
import ReportDesign from '../design/index';

const ReportRender: React.FC<{
  current: IForm;
  notityEmitter: Emitter;
  onItemSelected: (index: number) => void;
}> = ({ current, notityEmitter, onItemSelected }) => {
  if (current.metadata.attributes === undefined) {
    current.metadata.attributes = [];
  }
  return (
    <div style={{ padding: 16 }}>
      <Toolbar height={60}>
        <Item
          location="center"
          locateInMenu="never"
          render={() => (
            <div className="toolbar-label">
              <b style={{ fontSize: 28 }}>{current.name}</b>
            </div>
          )}
        />
      </Toolbar>

      <ReportDesign
        current={current}
        notityEmitter={notityEmitter}
        selectCellItem={(cell: any) => {
          if (cell.prop) {
            const index = current.metadata.attributes.findIndex(
              (i) => i.id === cell.prop?.id,
            );
            if (index > -1) {
              onItemSelected(index);
              return;
            }
          }
        }}></ReportDesign>
    </div>
  );
};

export default ReportRender;
