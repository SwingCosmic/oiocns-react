import { MappingData } from '@/ts/base/model';
import { isValidVariableName } from '@/utils/script';
import { Card, message } from 'antd';
import { Button, DataGrid, SelectBox, TextBox } from 'devextreme-react';
import { Paging, Editing, Column } from 'devextreme-react/data-grid';
import React from 'react';
import { useEffect, useState } from 'react';

interface Props {
  mappingData: MappingData[];
  onChange: (value: MappingData[]) => any;

  triggers: MappingData[];
}


export default function VariableMapping(props: Props) {
  const [mappingData, setMappingData] = useState<MappingData[]>([]);

  useEffect(() => {
    setMappingData(props.mappingData);
  }, [props.mappingData]);

  function updateMappingData(value: MappingData[]) {
    setMappingData(value);
    props.onChange(value);
  }

  const [argsCode, setArgsCode] = useState<string>();

  const [select, setSelect] = useState<MappingData>();

  const modalHeadStyl = {
    minHeight: '28px',
    paddingLeft: '0',
    paddingTop: '0',
    border: 'none',
  };
  const bodyBorderStyl = {
    border: '1px solid #eee',
  };

  const labelFontSize = {
    fontSize: '14px',
  };

  return (
    <Card
      title={<div style={{ ...labelFontSize }}>变量维护</div>}
      bordered={false}
      headStyle={modalHeadStyl}
      bodyStyle={{ ...bodyBorderStyl, paddingTop: '30px' }}>
      <>
        <TextBox
          width={'30%'}
          label="变量名称*"
          labelMode="outside"
          value={argsCode}
          onValueChange={setArgsCode}
          style={{ display: 'inline-block', margin: 2 }}
        />
        <SelectBox
          width={'45%'}
          label="变量对象*"
          labelMode="outside"
          valueExpr="key"
          value={select?.key}
          showClearButton
          displayExpr={(item) => {
            return item ? `[${item.formName}]${item.name}` : '';
          }}
          dataSource={props.triggers.filter(
            (a) => !mappingData.find((s) => s.id == a.id),
          )}
          style={{ display: 'inline-block', margin: 2 }}
          onSelectionChanged={(e) => {
            setSelect(e.selectedItem);
          }}
        />
        <Button
          width={'20%'}
          style={{ display: 'inline-block', margin: 2 }}
          onClick={() => {
            if (!select || !argsCode) {
              return;
            }
            if (!isValidVariableName(argsCode)) {
              message.error("变量名非法");
              return;
            }
            if (!mappingData.map((a) => a.code).includes(argsCode)) {
              setSelect(undefined);
              setArgsCode(undefined);
              updateMappingData([{ ...select, code: argsCode }, ...mappingData]);
            }
          }}>
          新增
        </Button>
      </>
      <DataGrid
        allowColumnResizing
        keyExpr="id"
        dataSource={mappingData}
        onSaved={(e) => {
          for (const change of e.changes) {
            if (change.type == 'remove') {
              updateMappingData(mappingData.filter((a) => a.id != change.key));
            }
          }
        }}>
        <Paging enabled={true} pageSize={10} />
        <Editing mode="row" allowDeleting={true} texts={'删除'} />
        <Column dataField="code" caption="变量代码" />
        <Column dataField="typeName" caption="类型" />
        <Column dataField="formName" caption="表单名称" />
        <Column dataField="name" caption="对象名称" />
      </DataGrid>
    </Card>
  );
}