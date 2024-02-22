import React, { useEffect, useState } from 'react';
import { Card, Modal, Space } from 'antd';
import { Button, DataGrid, SelectBox, TextArea, TextBox } from 'devextreme-react';
import { model, schema } from '@/ts/base';
import { getUuid } from '@/utils/tools';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { Column, Editing, Paging } from 'devextreme-react/data-grid';
import { isValidVariableName } from '@/utils/script';
import message from '@/utils/message';

interface IProps {
  primarys: schema.XForm[];
  details: schema.XForm[];
  current?: model.NodeCalcRule;
  onOk: (rule: model.NodeCalcRule) => void;
  onCancel: () => void;
}

const CalcRuleModal: React.FC<IProps> = (props) => {
  const [name, setName] = useState<string>();
  const [argsCode, setArgsCode] = useState<string>();
  const [triggers, setTriggers] = useState<model.MappingData[]>([]);
  const [select, setSelect] = useState<model.MappingData>();
  const [remark, setRemark] = useState<string>();
  const [formula, setFormula] = useState<string>();
  const [mappingData, setMappingData] = useState<model.MappingData[]>([]);
  const [target, setTarget] = useState<model.MappingData>();
  useEffect(() => {
    if (props.current) {
      setName(props.current.name);
      setRemark(props.current.remark);
      setTarget(props.current.target);
      setFormula(props.current.formula);
      setMappingData(props.current.mappingData);
    }
  }, [props.current]);

  useEffect(() => {
    const tgs: model.MappingData[] = [];
    props.primarys.forEach((a) => {
      tgs.push(
        ...a.attributes.map((s) => {
          return {
            id: s.id,
            key: a.id + s.id,
            formName: a.name,
            formId: a.id,
            typeName: '对象',
            trigger: s.id,
            code: '',
            name: s.name,
          };
        }),
      );
    });
    props.details.forEach((a) => {
      tgs.push(
        ...a.attributes.map((s) => {
          return {
            id: s.id,
            formName: a.name,
            key: a.id + s.id,
            formId: a.id,
            typeName: '集合',
            trigger: a.id,
            code: '',
            name: s.name,
          };
        }),
      );
    });
    setTriggers(tgs.filter((a) => a.id != target?.id));
  }, [props.details, props.primarys]);

  const vaildDisable = () => {
    return (
      name == undefined ||
      target == undefined ||
      formula == undefined ||
      mappingData.length <= 0
    );
  };
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
    <Modal
      destroyOnClose
      title={'计算规则'}
      width={800}
      open={true}
      bodyStyle={{ border: 'none', padding: 0, marginLeft: '32px', marginRight: '32px' }}
      onOk={() => {
        const trigger: string[] = [];
        mappingData!.forEach((a) => trigger.push(a.trigger));
        props.onOk.apply(this, [
          {
            id: props.current?.id ?? getUuid(),
            name: name!,
            remark: remark ?? '',
            target: target!,
            type: 'calc',
            trigger: trigger!,
            formula: formula!,
            mappingData: mappingData!,
          },
        ]);
      }}
      onCancel={props.onCancel}
      okButtonProps={{
        disabled: vaildDisable(),
      }}>
      <>
        <Space direction="vertical" size={15}>
          <TextBox
            label="名称"
            labelMode="outside"
            value={name}
            onValueChange={(e) => {
              setName(e);
            }}
          />
          <SelectBox
            valueExpr="key"
            label="目标对象"
            labelMode="outside"
            value={target?.key}
            showClearButton
            displayExpr={(item) => {
              return item ? `[${item.formName}]${item.name}` : '';
            }}
            dataSource={triggers.filter((a) => a.typeName == '对象')}
            onSelectionChanged={(e) => {
              setTarget(e.selectedItem);
            }}
          />
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
                dataSource={triggers.filter(
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
                    setMappingData([{ ...select, code: argsCode }, ...mappingData]);
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
                    setMappingData(mappingData.filter((a) => a.id != change.key));
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
          <Card
            title={<div style={{ ...labelFontSize }}>计算代码</div>}
            bordered={false}
            bodyStyle={{ ...bodyBorderStyl, paddingTop: '12px' }}
            headStyle={modalHeadStyl}>
            <CodeMirror
              aria-label="计算规则"
              value={formula}
              height={'100px'}
              extensions={[javascript()]}
              onChange={setFormula}
            />
          </Card>
          <TextArea
            style={{ marginBottom: '12px' }}
            label="描述"
            labelMode="outside"
            onValueChanged={(e) => {
              setRemark(e.value);
            }}
            value={remark}
          />
        </Space>
      </>
    </Modal>
  );
};
export default CalcRuleModal;
