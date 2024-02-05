import { Emitter } from '@/ts/base/common';
import { IForm } from '@/ts/core';
import { Form } from 'devextreme-react';
import { GroupItem, SimpleItem } from 'devextreme-react/form';
import React, { useEffect, useState } from 'react';
import CustomBuilder from './formRule/filter/builder';
import { FieldInfo } from 'typings/globelType';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import SpeciesList from './formRule/filter/tags/speciesList';

interface IAttributeProps {
  current: IForm;
  notifyEmitter: Emitter;
}

const FormConfig: React.FC<IAttributeProps> = ({ notifyEmitter, current }) => {
  const [fields, setFields] = useState<(FieldInfo & { fieldType?: string })[]>([]);
  const [loaded] = useAsyncLoad(async () => {
    const resultFields = await current.loadFields();
    const ss = resultFields.map((a) => {
      switch (a.valueType) {
        case '数值型':
          return {
            id: a.id,
            name: a.code,
            dataField: a.code,
            caption: a.name,
            dataType: 'number',
            fieldType: '数值型',
          };
        case '日期型':
          return {
            id: a.id,
            name: a.code,
            dataField: a.code,
            caption: a.name,
            dataType: 'date',
            fieldType: '日期型',
          };
        case '时间型':
          return {
            id: a.id,
            name: a.code,
            dataField: a.code,
            caption: a.name,
            dataType: 'datetime',
            fieldType: '时间型',
          };
        case '选择型':
          return {
            id: a.id,
            name: a.code,
            dataField: a.code,
            caption: a.name,
            fieldType: '选择型',
            dataType: 'string',
            lookup: {
              displayExpr: 'text',
              valueExpr: 'value',
              allowClearing: true,
              dataSource: a.lookups,
            },
          };
        case '分类型':
          return {
            id: a.id,
            name: a.code,
            dataField: a.code,
            caption: a.name,
            fieldType: '分类型',
            dataType: 'string',
            filterOperations: ['sequal', 'snotequal'],
            lookup: {
              displayExpr: 'text',
              valueExpr: 'value',
              allowClearing: true,
              dataSource: a.lookups,
            },
          };
        default:
          return {
            id: a.id,
            name: a.code,
            dataField: a.code,
            caption: a.name,
            dataType: 'string',
            fieldType: '未知',
          };
      }
    });
    ss.unshift();
    setFields([
      {
        id: 'name',
        name: 'name',
        dataField: 'name',
        caption: '名称',
        dataType: 'string',
      },
      ...(ss as FieldInfo[]),
    ]);
  }, [current]);

  const [conditionText, setConditionText] = useState('[]');

  const notityAttrChanged = () => {
    notifyEmitter.changCallback('form');
  };

  const setFilterCondition = (value: string, text: string) => {
    current.metadata.options!.dataRange!['filterExp'] = value;
    current.metadata.options!.dataRange!['filterDisplay'] = text;
  };

  useEffect(() => {
    if (!current.metadata.options) {
      current.metadata.options = { itemWidth: 300 };
    }
    current.metadata.options.dataRange = current.metadata.options.dataRange ?? {
      labels: [],
    };
    current.metadata.options.workDataRange = current.metadata.options.workDataRange ?? {
      labels: [],
    };
    if (current.metadata.options.dataRange.filterDisplay) {
      setConditionText(current.metadata.options?.dataRange['filterDisplay']);
    }
  }, [current]);
  return (
    <>
      <Form
        scrollingEnabled
        height={'calc(100vh - 130px)'}
        formData={current.metadata}
        onFieldDataChanged={notityAttrChanged}>
        <GroupItem>
          <SimpleItem dataField="name" isRequired={true} label={{ text: '名称' }} />
          <SimpleItem dataField="code" isRequired={true} label={{ text: '代码' }} />
          <SimpleItem
            dataField="options.itemWidth"
            editorType="dxNumberBox"
            label={{ text: '特性宽度' }}
            editorOptions={{
              min: 200,
              max: 800,
              step: 10,
              format: '#(px)',
              defaultValue: 300,
              showClearButton: true,
              showSpinButtons: true,
            }}
          />
          <SimpleItem
            dataField="remark"
            editorType="dxTextArea"
            isRequired={true}
            label={{ text: '表单描述' }}
            editorOptions={{
              height: 100,
            }}
          />
        </GroupItem>
        <GroupItem caption="查看设置">
          <SimpleItem
            label={{ text: '值筛选' }}
            render={() =>
              loaded && (
                <CustomBuilder
                  fields={fields}
                  displayText={conditionText}
                  onValueChanged={(value, text) => {
                    setConditionText(text);
                    setFilterCondition(value, text);
                  }}
                />
              )
            }
          />
          <SimpleItem
            label={{ text: '类筛选' }}
            render={() => <SpeciesList fields={fields} form={current} />}
          />
        </GroupItem>
      </Form>
    </>
  );
};

export default FormConfig;
