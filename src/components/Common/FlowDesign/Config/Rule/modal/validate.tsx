import React, { useEffect, useState } from 'react';
import { Card, Modal, Space, message as _message } from 'antd';
import { Button, DataGrid, SelectBox, TextArea, TextBox } from 'devextreme-react';
import { model, schema } from '@/ts/base';
import { getUuid } from '@/utils/tools';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import VariableMapping from './VariableMapping';
import { ErrorLevel } from '@/ts/base/model';
import { transformExpression } from '@/utils/script';

interface IProps {
  primarys: schema.XForm[];
  details: schema.XForm[];
  current?: model.NodeValidateRule;
  onOk: (rule: model.NodeValidateRule) => void;
  onCancel: () => void;
}

export default function ValidateRuleModal(props: IProps)  {
  const [name, setName] = useState<string>('');
  const [message, setMessage] = useState<string>('校验失败');
  const [errorLevel, setErrorLevel] = useState<ErrorLevel>('error');
  // const [argsCode, setArgsCode] = useState<string>();
  const [triggers, setTriggers] = useState<model.MappingData[]>([]);
  // const [select, setSelect] = useState<model.MappingData>();
  const [remark, setRemark] = useState<string>();
  const [formula, setFormula] = useState<string>();
  const [mappingData, setMappingData] = useState<model.MappingData[]>([]);
  // const [target, setTarget] = useState<model.MappingData>();
  useEffect(() => {
    if (props.current) {
      setName(props.current.name);
      setMessage(props.current.message);
      setErrorLevel(props.current.errorLevel);
      setRemark(props.current.remark);
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
    setTriggers(tgs);
  }, [props.details, props.primarys]);

  const vaildDisable = () => {
    return (
      name == undefined ||
      message == undefined ||
      errorLevel == undefined ||
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
      title={'校验规则'}
      width={800}
      open={true}
      bodyStyle={{ border: 'none', padding: 0, marginLeft: '32px', marginRight: '32px' }}
      onOk={() => {
        try {
          transformExpression(formula!);
        } catch (error) {
          let msg = error instanceof Error ? error.message : String(error);
          _message.error(<div>
            <div>计算代码错误</div>
            <pre style={{textAlign: 'left'}}><code>{msg}</code></pre>
          </div>);
          return;
        }
        const trigger: string[] = [];
        mappingData!.forEach((a) => trigger.push(a.trigger));
        props.onOk(
          {
            id: props.current?.id ?? getUuid(),
            name: name,
            remark: remark ?? '',
            type: 'validate',
            message: message,
            errorLevel: errorLevel,
            trigger: trigger!,
            formula: formula!,
            mappingData: mappingData!,
          },
        );
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
          <TextArea
            label="校验提示信息"
            labelMode="outside"
            value={message}
            onValueChange={(e) => {
              setMessage(e);
            }}
          />
          <SelectBox
            valueExpr="value"
            label="校验错误类型"
            labelMode="outside"
            value={errorLevel}
            displayExpr="name"
            dataSource={[
              {
                name: '提示',
                value: 'info',
              },
              {
                name: '警告',
                value: 'warning',
              },
              {
                name: '错误',
                value: 'error',
              },
            ]}
            onSelectionChanged={(e) => {
              setErrorLevel(e.selectedItem.value);
            }}
          />
          <VariableMapping 
            mappingData={mappingData}
            onChange={v => setMappingData(v)}
            triggers={triggers}
          />
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