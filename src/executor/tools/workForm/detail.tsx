import { model, schema } from '../../../ts/base';
import { IBelong, ITarget } from '@/ts/core';
import { useEffect, useState } from 'react';
import React from 'react';
import { Modal, Tabs } from 'antd';
import { EditModal } from '../editModal';
import GenerateThingTable from '../generate/thingTable';
import { getUuid } from '@/utils/tools';
import { Uploader, generating } from '../uploadTemplate';
import * as el from '@/utils/excel';
import { XThing } from '@/ts/base/schema';
import { AiFillEdit, AiFillRest } from 'react-icons/ai';
import { deepClone } from '@/ts/base/common';

interface IProps {
  allowEdit: boolean;
  belong: IBelong;
  forms: schema.XForm[];
  infos: model.FormInfo[];
  changedFields: model.MappingData[];
  data: model.InstanceDataModel;
  getFormData: (form: schema.XForm) => model.FormEditData;
  onChanged?: (id: string, data: model.FormEditData, field: string, value: any) => void;
  target?: ITarget;
}

const DetailTable: React.FC<IProps> = (props) => {
  if (props.forms.length < 1) return <></>;
  const form = props.forms[0];
  const info = props.infos[0];
  if (!props.data.fields[form.id]) return <></>;
  const fields = props.data.fields[form.id];
  const operateRule = {
    allowAdd: info?.allowAdd ?? true,
    allowEdit: info?.allowEdit ?? true,
    allowSelect: info?.allowSelect ?? true,
  };
  const [key, setKey] = useState<string>(form.id);
  const [formData, setFormData] = useState(props.getFormData(form));
  const [selectKeys, setSelectKeys] = useState<string[]>([]);
  useEffect(() => {
    var after = formData.after.at(-1);
    if (after) {
      after.name = form.name;
    }
    props.onChanged?.apply(this, [form.id, formData, '', {}]);
  }, [formData]);
  useEffect(() => {
    if (props.changedFields.find((s) => s.formId == form.id)) {
      setKey(getUuid());
    }
  }, [props.changedFields]);
  const loadMenus = () => {
    if (props.allowEdit) {
      var items = [
        {
          key: 'remove',
          label: '移除',
          icon: <AiFillRest fontSize={22} />,
        },
      ];
      if (operateRule.allowEdit) {
        items.unshift({
          key: 'update',
          label: '更新',
          icon: <AiFillEdit fontSize={22} />,
        });
      }
      return {
        items: items,
        onMenuClick(key: string, data: XThing) {
          switch (key) {
            case 'update':
              EditModal.showFormEdit({
                form: form,
                fields: fields,
                belong: props.belong,
                create: false,
                initialValues: data,
                onSave: (values) => {
                  const thing = formData.after.find((a) => a.id == data.id);
                  if (thing) {
                    Object.keys(values).forEach((k) => {
                      thing[k] = values[k];
                    });
                  }
                  setFormData({ ...formData });
                },
              });
              break;
            case 'remove':
              formData.before = formData.before.filter((i) => i.id != data.id);
              formData.after = formData.after.filter((i) => i.id != data.id);
              setSelectKeys([]);
              setFormData({ ...formData });
              break;
          }
        },
      };
    }
  };
  return (
    <GenerateThingTable
      key={key}
      fields={fields}
      height={500}
      dataIndex={'attribute'}
      selection={
        props.allowEdit
          ? {
              mode: 'multiple',
              allowSelectAll: true,
              selectAllMode: 'allPages',
              showCheckBoxesMode: 'always',
            }
          : undefined
      }
      onSelectionChanged={(e) => setSelectKeys(e.selectedRowKeys)}
      toolbar={{
        visible: true,
        items: [
          {
            name: 'add',
            location: 'after',
            widget: 'dxButton',
            options: {
              text: '新增',
              icon: 'add',
              onClick: () => {
                EditModal.showFormEdit({
                  form: form,
                  fields: fields,
                  belong: props.belong,
                  target: props.target,
                  create: true,
                  onSave: (values) => {
                    console.log(values);
                    formData.after.push(values);
                    setFormData({ ...formData });
                  },
                });
              },
            },
            visible: props.allowEdit && operateRule['allowAdd'],
          },
          {
            name: 'import',
            location: 'after',
            widget: 'dxButton',
            options: {
              text: '导入',
              icon: 'add',
              onClick: async () => {
                const values = deepClone(fields);
                values.unshift({
                  id: 'id',
                  name: '唯一标识',
                  code: 'id',
                  valueType: '描述型',
                  remark: '唯一标识',
                });
                const excel = new el.Excel(el.getAnythingSheets(form, values));
                const modal = Modal.info({
                  icon: <></>,
                  okText: '关闭',
                  width: 610,
                  title: form.name + '导入',
                  maskClosable: true,
                  content: (
                    <Uploader
                      templateName={form.name}
                      excel={excel}
                      finished={() => {
                        modal.destroy();
                        generating(
                          props.belong,
                          form.name,
                          excel.handlers[0].sheet.data,
                          formData,
                          () => setFormData({ ...formData }),
                        );
                      }}
                    />
                  ),
                });
              },
            },
            visible: props.allowEdit && operateRule['allowAdd'],
          },
          {
            name: 'edit',
            location: 'after',
            widget: 'dxButton',
            options: {
              text: '变更',
              icon: 'edit',
              onClick: () => {
                EditModal.showFormEdit({
                  form: form,
                  fields: fields,
                  belong: props.belong,
                  create: false,
                  onSave: (values) => {
                    formData.after = formData.after.map((item) => {
                      if (selectKeys.includes(item.id)) {
                        Object.keys(values).forEach((k) => {
                          item[k] = values[k];
                        });
                      }
                      return item;
                    });
                    setFormData({ ...formData });
                  },
                });
              },
            },
            visible: props.allowEdit && operateRule['allowEdit'] && selectKeys.length > 0,
          },
          {
            name: 'select',
            location: 'after',
            widget: 'dxButton',
            options: {
              text: '选择',
              icon: 'bulletlist',
              onClick: () => {
                EditModal.showFormSelect({
                  form: form,
                  fields: fields,
                  belong: props.belong,
                  onSave: (values) => {
                    values.forEach((item) => {
                      if (formData.after.every((i) => i.id !== item.id)) {
                        formData.after.unshift(item);
                      }
                      if (formData.before.every((i) => i.id !== item.id)) {
                        formData.before.unshift({ ...item });
                      }
                    });
                    setFormData({ ...formData });
                  },
                });
              },
            },
            visible: props.allowEdit && operateRule['allowSelect'],
          },
          {
            name: 'remove',
            location: 'after',
            widget: 'dxButton',
            options: {
              text: '移除',
              icon: 'remove',
              onClick: () => {
                formData.before = formData.before.filter(
                  (i) => !selectKeys.includes(i.id),
                );
                formData.after = formData.after.filter((i) => !selectKeys.includes(i.id));
                setSelectKeys([]);
                setFormData({ ...formData });
              },
            },
            visible: props.allowEdit && selectKeys.length > 0,
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
      dataMenus={loadMenus()}
      dataSource={formData.after}
      beforeSource={formData.before}
    />
  );
};

const DetailForms: React.FC<IProps> = (props) => {
  if (props.forms.length < 1) return <></>;
  const [activeTabKey, setActiveTabKey] = useState(props.forms[0].id);
  const loadItems = () => {
    const items = [];
    for (const form of props.forms) {
      let info = props.infos.find((item) => item.id == form.id) ?? ({} as model.FormInfo);
      if (
        props.data.rules?.find(
          (a) => a.destId == form.id && a.typeName == 'visible' && !a.value,
        )
      ) {
        continue;
      }
      items.push({
        key: form.id,
        forceRender: true,
        label: form.name,
        children: <DetailTable {...props} forms={[form]} infos={[info]} />,
      });
    }
    return items;
  };
  return (
    <Tabs
      items={loadItems()}
      activeKey={activeTabKey}
      onChange={(key) => setActiveTabKey(key)}
    />
  );
};

export default DetailForms;
