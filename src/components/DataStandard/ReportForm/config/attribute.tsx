import { Emitter } from '@/ts/base/common';
import { IForm } from '@/ts/core';
import { Form } from 'devextreme-react';
import { GroupItem, SimpleItem } from 'devextreme-react/form';
import React, { useEffect, useState } from 'react';
import { getWidget, loadwidgetOptions } from '@/components/DataStandard/WorkForm/Utils';
import { schema } from '@/ts/base';
import TreeSelectItem from '@/components/DataStandard/WorkForm/Viewer/customItem/treeItem';
import OpenFileDialog from '@/components/OpenFileDialog';
import AttributeSetting from '@/components/DataStandard/WorkForm/Design/config/formRule/setting/attributeSetting';
import { Button, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import CalcRuleModal from '@/components/DataStandard/WorkForm/Design/config/formRule/modal/calcRule';
import { model } from '@/ts/base';
import { FieldInfo } from 'typings/globelType';
import useAsyncLoad from '@/hooks/useAsyncLoad';

interface IAttributeProps {
  index: number;
  current: IForm;
  notifyEmitter: Emitter;
}

const AttributeConfig: React.FC<IAttributeProps> = ({
  current,
  notifyEmitter,
  index,
}) => {
  const [fields, setFields] = useState<FieldInfo[]>([]);
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

  const [openDialog, setOpenDialog] = useState(false);
  const [attribute, setAttribute] = useState(current.metadata.attributes[index]);
  const [items, setItems] = useState<schema.XSpeciesItem[]>([]);
  const [refForm, setRefForm] = useState<schema.XForm | null>(null);
  const [openType, setOpenType] = useState(0);
  const [select, setSelect] = useState<model.Rule>();

  const [readOnlyConditions, setReadOnlyConditions] = useState(
    current.metadata.attributes[index].options!['readOnlyConditions'],
  );
  const [isRequiredConditions, setIsRequiredConditions] = useState(
    current.metadata.attributes[index].options!['isRequiredConditions'],
  );

  const notityAttrChanged = () => {
    current.metadata.attributes[index] = attribute;
    notifyEmitter.changCallback('attr', attribute);
    if (attribute.property?.valueType === '用户型') {
      setAttribute({ ...attribute });
    }
  };

  async function loadAttributeResource() {
    if (!attribute.property) {
      return;
    }

    if (attribute.property.valueType == '引用型') {
      if (attribute.property.formId) {
        const data = await current.loadReferenceForm(attribute.property.formId);
        setRefForm(data);
      }
    } else {
      const speciesId = attribute.property.speciesId;
      if (speciesId && speciesId.length > 5) {
        const data = await current.loadItems([speciesId]);
        setItems(data);
      } else {
        setItems([]);
      }
    }
  }

  const updateAttribute = (value: any, field: string | number) => {
    const _attribute: any = { ...attribute };
    _attribute['options'][field] = value;
    setAttribute(_attribute);
  };

  useEffect(() => {
    loadAttributeResource();
    setSelect(JSON.parse(attribute?.rule ?? '{}'));
    setReadOnlyConditions(attribute.options!['readOnlyConditions']);
    setIsRequiredConditions(attribute.options!['isRequiredConditions']);
  }, [attribute]);

  useEffect(() => {
    setAttribute({
      ...current.metadata.attributes[index],
      widget: getWidget(
        current.metadata.attributes[index].property?.valueType,
        current.metadata.attributes[index].widget,
      ),
    });
  }, [index]);

  const loadItemConfig = () => {
    const options = [];
    switch (attribute.widget) {
      case '数字框':
        options.push(
          <SimpleItem
            dataField="options.max"
            editorType="dxNumberBox"
            label={{ text: '最大值' }}
          />,
          <SimpleItem
            dataField="options.min"
            editorType="dxNumberBox"
            label={{ text: '最小值' }}
          />,
          <SimpleItem dataField="options.format" label={{ text: '显示格式' }} />,
          <SimpleItem
            dataField="options.defaultValue"
            editorType="dxNumberBox"
            label={{ text: '默认值' }}
          />,
          <SimpleItem
            // dataField="options.defaultValue"
            // editorType="dxNumberBox"
            label={{ text: '计算规则', visible: true }}
            render={() =>
              select?.id ? (
                <span>
                  <Button
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => {
                      setSelect(JSON.parse(attribute?.rule ?? '{}'));
                      setOpenType(1);
                    }}>
                    编辑计算规则
                  </Button>
                  <Popconfirm
                    key={'delete'}
                    title="确定删除吗？"
                    onConfirm={() => {
                      setSelect(undefined);
                      current.metadata.attributes[index].rule = '{}';
                    }}>
                    <Button type="link" icon={<DeleteOutlined />} danger>
                      删除计算规则
                    </Button>
                  </Popconfirm>
                </span>
              ) : (
                <Button
                  type="link"
                  onClick={() => {
                    setSelect(undefined);
                    setOpenType(1);
                  }}>
                  添加计算规则
                </Button>
              )
            }
          />,
        );
        break;
      case '文本框':
      case '多行文本框':
      case '富文本框':
        options.push(
          <SimpleItem
            dataField="options.maxLength"
            editorType="dxNumberBox"
            label={{ text: '最大长度' }}
          />,
          <SimpleItem dataField="options.defaultValue" label={{ text: '默认值' }} />,
        );
        break;
      case '选择框':
        options.push(
          <SimpleItem
            dataField="options.searchEnabled"
            editorType="dxCheckBox"
            label={{ text: '是否允许搜索' }}
          />,
          <SimpleItem
            dataField="options.defaultValue"
            editorType="dxSelectBox"
            label={{ text: '默认值' }}
            editorOptions={{
              displayExpr: 'text',
              valueExpr: 'value',
              dataSource: items.map((i) => {
                return {
                  id: i.id,
                  text: i.name,
                  value: `S${i.id}`,
                  icon: i.icon,
                  parentId: i.parentId,
                };
              }),
            }}
          />,
        );
        break;
      case '引用选择框':
        options.push(
          <SimpleItem
            dataField="options.allowViewDetail"
            editorType="dxCheckBox"
            label={{ text: '允许查看数据详情' }}
            // editorOptions={{
            //   disabled: true,
            // }}
          />,
          <SimpleItem
            dataField="options.multiple"
            editorType="dxCheckBox"
            label={{ text: '是否支持多选' }}
            // editorOptions={{
            //   disabled: true,
            // }}
          />,
          <SimpleItem
            dataField="options.nameAttribute"
            editorType="dxSelectBox"
            label={{ text: '展示文字的特性' }}
            editorOptions={{
              displayExpr: 'name',
              valueExpr: 'id',
              dataSource: (refForm?.attributes || []).filter((i) => {
                return i.property?.valueType == '描述型';
              }),
            }}
          />,
        );
        break;
      case '多级选择框':
        options.push(
          <SimpleItem
            dataField="options.searchEnabled"
            editorType="dxCheckBox"
            label={{ text: '是否允许搜索' }}
          />,
          <SimpleItem
            label={{ text: '默认值' }}
            render={() => (
              <TreeSelectItem
                label="默认值"
                flexWrap="wrap"
                showMaskMode="always"
                labelMode="floating"
                showClearButton
                defaultValue={attribute.options?.defaultValue}
                onValueChange={(value) => {
                  attribute.options!['defaultValue'] = value;
                  notityAttrChanged();
                }}
                speciesItems={items.map((a) => {
                  return {
                    id: a.id,
                    text: a.name,
                    value: `S${a.id}`,
                    parentId: a.parentId,
                  };
                })}
              />
            )}
          />,
        );
        break;
      case '日期选择框':
        {
          const dateFormat =
            attribute.options && 'displayFormat' in attribute.options
              ? attribute.options['displayFormat']
              : 'yyyy年MM月dd日';
          options.push(
            <SimpleItem
              dataField="options.max"
              editorType="dxDateBox"
              label={{ text: '最大值' }}
              editorOptions={{
                type: 'date',
                displayFormat: dateFormat,
              }}
            />,
            <SimpleItem
              dataField="options.min"
              editorType="dxDateBox"
              label={{ text: '最小值' }}
              editorOptions={{
                type: 'date',
                displayFormat: dateFormat,
              }}
            />,
            <SimpleItem
              dataField="options.displayFormat"
              editorOptions={{ value: dateFormat }}
              label={{ text: '格式' }}
            />,
            <SimpleItem
              dataField="options.defaultValue"
              editorType="dxDateBox"
              label={{ text: '默认值' }}
              editorOptions={{
                type: 'date',
                displayFormat: dateFormat,
              }}
            />,
          );
        }
        break;
      case '时间选择框':
        {
          const timeFormat =
            attribute.options && 'displayFormat' in attribute.options
              ? attribute.options['displayFormat']
              : 'yyyy年MM月dd日 HH:mm:ss';
          options.push(
            <SimpleItem
              dataField="options.max"
              editorType="dxDateBox"
              label={{ text: '最大值' }}
              editorOptions={{
                type: 'datetime',
                displayFormat: timeFormat,
              }}
            />,
            <SimpleItem
              dataField="options.min"
              editorType="dxDateBox"
              label={{ text: '最小值' }}
              editorOptions={{
                type: 'datetime',
                displayFormat: timeFormat,
              }}
            />,
            <SimpleItem
              dataField="options.displayFormat"
              editorOptions={{ value: timeFormat }}
              label={{ text: '格式' }}
            />,
            <SimpleItem
              dataField="options.defaultValue"
              editorType="dxSelectBox"
              label={{ text: '默认值' }}
              editorOptions={{
                type: 'datetime',
                displayFormat: timeFormat,
              }}
            />,
          );
        }
        break;
      case '文件选择框':
        options.push(
          <SimpleItem
            dataField="options.maxLength"
            editorType="dxNumberBox"
            label={{ text: '最大文件数量' }}
          />,
        );
        break;
      default:
        break;
    }
    return options;
  };

  return (
    <Form
      key={index}
      height={'calc(100vh - 130px)'}
      scrollingEnabled
      labelMode="floating"
      formData={attribute}
      onFieldDataChanged={notityAttrChanged}>
      <GroupItem>
        <SimpleItem dataField="name" isRequired={true} label={{ text: '名称' }} />
        <SimpleItem dataField="code" isRequired={true} label={{ text: '代码' }} />
        <SimpleItem
          dataField="widget"
          editorType="dxSelectBox"
          label={{ text: '组件' }}
          editorOptions={{
            items: loadwidgetOptions(attribute),
          }}
        />
        {attribute.widget === '成员选择框' && (
          <SimpleItem
            dataField="options.teamId"
            editorType="dxSelectBox"
            label={{ text: '选择上级组织' }}
            editorOptions={{
              valueExpr: 'id',
              displayExpr: 'name',
              dataSource: current.directory.target.space.targets,
            }}
          />
        )}
        {attribute.widget === '成员选择框' && (
          <SimpleItem
            dataField="options.isOperator"
            editorType="dxCheckBox"
            label={{ text: '限定为操作用户' }}
          />
        )}
        <SimpleItem
          dataField="remark"
          editorType="dxTextArea"
          isRequired={true}
          label={{ text: '描述' }}
          editorOptions={{
            height: 100,
          }}
        />
      </GroupItem>
      <GroupItem>
        <SimpleItem
          dataField="options.readOnly"
          // editorType="dxCheckBox"
          label={{ text: '只读特性', visible: true }}
          render={() =>
            loaded && (
              <AttributeSetting
                fields={fields}
                fieldName="readOnly"
                value={attribute.options!['readOnly']}
                // conditionConfig={attribute.options!['readOnlyConditions']}
                conditionConfig={readOnlyConditions}
                current={current}
                onValueChanged={(value: any, field: string) => {
                  updateAttribute(value, field);
                }}
                onConditionsChanged={(value: any, field: string) => {
                  updateAttribute(value, field);
                  setReadOnlyConditions(value);
                }}
                onConditionsDelete={(field: string) => {
                  updateAttribute(undefined, field);
                  setReadOnlyConditions(undefined);
                }}
              />
            )
          }
        />
        <SimpleItem
          dataField="options.isRequired"
          // editorType="dxCheckBox"
          label={{ text: '必填特性', visible: true }}
          render={() =>
            loaded && (
              <AttributeSetting
                fields={fields}
                fieldName="isRequired"
                value={attribute.options!['isRequired']}
                // conditionConfig={attribute.options!['isRequiredConditions']}
                conditionConfig={isRequiredConditions}
                current={current}
                onValueChanged={(value: any, field: string) => {
                  updateAttribute(value, field);
                }}
                onConditionsChanged={(value: any, field: string) => {
                  updateAttribute(value, field);
                  setIsRequiredConditions(value);
                }}
                onConditionsDelete={(field: string) => {
                  updateAttribute(undefined, field);
                  setIsRequiredConditions(undefined);
                }}
              />
            )
          }
        />
        <SimpleItem
          dataField="options.showToRemark"
          editorType="dxCheckBox"
          label={{ text: '展示至摘要' }}
        />
        {loadItemConfig()}
      </GroupItem>
      <GroupItem caption="查看设置">
        <SimpleItem
          dataField="options.fixed"
          editorType="dxCheckBox"
          label={{ text: '固定列' }}
        />
        <SimpleItem
          dataField="options.visible"
          editorType="dxCheckBox"
          label={{ text: '默认显示列' }}
        />
        {attribute.property?.speciesId && (
          <SimpleItem
            dataField="options.species"
            editorType="dxCheckBox"
            label={{ text: '显示到类目树' }}
          />
        )}
      </GroupItem>
      {openDialog && (
        <OpenFileDialog
          multiple
          rootKey={current.spaceKey}
          accepts={['用户']}
          allowInherited
          maxCount={1}
          onCancel={() => setOpenDialog(false)}
          onOk={() => {}}
        />
      )}
      {openType == 1 && loaded && (
        <CalcRuleModal
          fields={fields}
          onCancel={() => setOpenType(0)}
          current={select as model.FormCalcRule}
          targetId={attribute.id}
          onOk={(rule) => {
            setSelect(rule);
            setAttribute({
              ...attribute,
              rule: JSON.stringify(rule),
            });
            current.metadata.attributes[index].rule = JSON.stringify(rule);
            setOpenType(0);
          }}
        />
      )}
    </Form>
  );
};

export default AttributeConfig;
