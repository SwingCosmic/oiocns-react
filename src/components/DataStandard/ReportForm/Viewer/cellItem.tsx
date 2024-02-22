import React, { useEffect, useState } from 'react';
import { useEffectOnce } from 'react-use';
import { model } from '@/ts/base';
import { Emitter } from '@/ts/base/common';
import { IBelong, TargetType } from '@/ts/core';
import { Modal } from 'antd';
import { getWidget } from '../../WorkForm/Utils';
import SearchTargetItem from './components/searchTarget';
import TreeTargetItem from './components/treeTarget';
import DepartmentItem from './components/departmentBox';
import MemberItem from './components/memberBox';
import { DateBox } from 'devextreme-react';
import { formatDate } from '@/utils';

interface ICellItemProps {
  data: any;
  belong: IBelong;
  rules: model.RenderRule[];
  readOnly?: boolean;
  field: model.FieldModel;
  notifyEmitter: Emitter;
  selectValue: string;
  onValuesChange?: (field: string, value: any) => void;
  onCancel: () => void;
  writeData: (text: string) => void;
}

const CellItem: React.FC<ICellItemProps> = (props) => {
  const [value, setValue] = useState<any>();

  useEffect(() => {
    const id = props.notifyEmitter.subscribe(() => {});
    return () => {
      props.notifyEmitter.unsubscribe(id);
    };
  }, []);

  useEffectOnce(() => {
    if (props.data[props.field.id] == undefined && props.field.options?.defaultValue) {
      props.onValuesChange?.apply(this, [
        props.field.id,
        props.field.options?.defaultValue,
      ]);
    }
  });

  const mixOptions: any = {
    name: props.field.id,
    showClearButton: true,
    label: props.field.name,
    hint: props.field.remark,
    showMaskMode: 'always',
    labelMode: 'floating',
    labelLocation: 'left',
    ...props.field.options,
    visible: props.field.options?.hideField != true,
    isRequired: props.field.options?.isRequired == true,
    defaultValue: props.data[props.field.id] ?? props.field.options?.defaultValue,
    selectValue: props.selectValue,
    onValueChanged: (e: any) => {
      if (e.value !== props.data[props.field.id]) {
        setValue(e.value);
        props.writeData(e.title ? e.title : e.value);
      }
    },
  };

  const getComonpent = () => {
    switch (getWidget(props.field.valueType, props.field.widget)) {
      case '选择框':
      case '多级选择框':
        return <TreeTargetItem {...mixOptions} speciesItems={props.field.lookups} />;
      case '成员选择框':
        return <MemberItem {...mixOptions} target={props.belong.metadata} />;
      case '内部机构选择框':
        return <DepartmentItem {...mixOptions} target={props.belong.metadata} />;
      case '人员搜索框':
        return <SearchTargetItem {...mixOptions} typeName={TargetType.Person} />;
      case '单位搜索框':
        return <SearchTargetItem {...mixOptions} typeName={TargetType.Company} />;
      case '群组搜索框':
        return <SearchTargetItem {...mixOptions} typeName={TargetType.Cohort} />;
      case '组织群搜索框':
        return <SearchTargetItem {...mixOptions} typeName={TargetType.Group} />;
      case '日期选择框':
        return (
          <DateBox
            {...mixOptions}
            type={'date'}
            displayFormat={'yyyy年MM月dd日'}
            onValueChanged={(e) => {
              mixOptions.onValueChanged.apply(this, [
                {
                  ...e,
                  value: e.value ? formatDate(e.value, 'yyyy-MM-dd') : undefined,
                },
              ]);
            }}
          />
        );
      case '时间选择框':
        return (
          <DateBox
            {...mixOptions}
            type={'datetime'}
            displayFormat={'yyyy年MM月dd日 HH:mm:ss'}
            onValueChanged={(e) => {
              mixOptions.onValueChanged.apply(this, [
                {
                  ...e,
                  value: e.value ? formatDate(e.value, 'yyyy-MM-dd hh:mm:ss') : undefined,
                },
              ]);
            }}
          />
        );
      case '引用选择框':
      default:
        return '';
    }
  };

  return (
    <Modal
      destroyOnClose
      title={'选择框'}
      open={true}
      onOk={() => {
        props.onValuesChange?.apply(this, [props.field.id, value]);
        props.onCancel();
      }}
      onCancel={props.onCancel}>
      <div style={{ height: 400 }}>{getComonpent()}</div>
    </Modal>
  );
};

export default CellItem;
