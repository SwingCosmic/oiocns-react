import FormItem from '@/components/DataStandard/WorkForm/Viewer/formItem';
import OpenFileDialog from '@/components/OpenFileDialog';
import SchemaForm from '@/components/SchemaForm';
import { CollectionTable } from '@/executor/operate/entityForm/collectionForm';
import { model, schema } from '@/ts/base';
import { Emitter, deepClone, generateUuid } from '@/ts/base/common';
import { FieldModel } from '@/ts/base/model';
import { IWork } from '@/ts/core';
import { ShareIdSet } from '@/ts/core/public/entity';
import { ProFormInstance } from '@ant-design/pro-form';
import ProTable from '@ant-design/pro-table';
import {
  Button,
  Card,
  Checkbox,
  Empty,
  Input,
  Modal,
  Space,
  Table
} from 'antd';
import { SelectBox } from 'devextreme-react';
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { AiOutlineCloseCircle } from 'react-icons/ai';
import EntityIcon from '../GlobalComps/entityIcon';
import cls from './index.module.less';

interface IProps {
  work: IWork;
  executors: model.Executor[];
  deleteFuc: (id: string) => void;
  onClick?: Function;
}

const ExecutorShowComp: React.FC<IProps> = (props) => {
  const data = props.executors || [];
  return (
    <div className={cls.layout}>
      <div className={cls.title}>已选{data.length}条数据</div>
      <Space direction="vertical">
        {data.map((item: model.Executor, index: number) => {
          switch (item.funcName) {
            case '数据申领':
              return (
                <Acquire
                  key={index}
                  executor={item}
                  deleteFuc={props.deleteFuc}
                  work={props.work}
                />
              );
            case '归属权变更':
              return (
                <Common key={index} executor={item} deleteFuc={props.deleteFuc}>
                  多用于转变数据归属权使用（公益仓、公物仓、商城等）
                </Common>
              );
            case '字段变更':
              return (
                <FieldChange
                  key={index}
                  work={props.work}
                  executor={item}
                  deleteFuc={props.deleteFuc}
                />
              );
            case 'Webhook':
              return <Webhook executor={item} deleteFuc={props.deleteFuc} />;
            default:
              return <></>;
          }
        })}
      </Space>
    </div>
  );
};

interface CommonProps {
  executor: model.Executor;
  deleteFuc: (id: string) => void;
}

interface ExecutorProps extends CommonProps {
  children?: ReactNode | ReactNode[];
  extra?: ReactNode[];
}

const Common: React.FC<ExecutorProps> = (props) => {
  return (
    <Card
      title={props.executor.funcName}
      extra={
        <Space>
          {...props.extra || []}
          <AiOutlineCloseCircle
            className={cls.closeIcon}
            onClick={() => {
              props.deleteFuc(props.executor.id);
            }}
          />
        </Space>
      }>
      {props.children}
    </Card>
  );
};

interface AcquireProps extends CommonProps {
  work: IWork;
}

const Acquire: React.FC<AcquireProps> = (props) => {
  const [center, setCenter] = useState(<></>);
  return (
    <Common executor={props.executor} deleteFuc={props.deleteFuc}>
      <Space direction="vertical">
        用于子单位向群管理单位申领数据使用
        <Space>
          <span>数据源单位</span>
          <EntityIcon entityId={props.executor.belongId} showName />
          <Button
            size="small"
            onClick={() =>
              setCenter(<Configuration {...props} finished={() => setCenter(<></>)} />)
            }>
            配置
          </Button>
        </Space>
      </Space>
      {center}
    </Common>
  );
};

interface ConfigurationProps extends AcquireProps {
  finished: () => void;
}

const Configuration: React.FC<ConfigurationProps> = (props) => {
  const [acquires, setAcquires] = useState(props.executor.acquires ?? []);
  const [center, setCenter] = useState(<></>);
  const updateChecked = (id: string, checked: boolean) => {
    const acquire = props.executor.acquires.find((item) => item.id == id);
    if (acquire) {
      acquire.enable = checked;
      setAcquires([...props.executor.acquires]);
    }
  };
  const openSelect = (typeName: string, accepts: string[], multiple: boolean = false) => {
    setCenter(
      <OpenFileDialog
        accepts={accepts}
        rootKey={props.work.directory.spaceKey}
        excludeIds={acquires.map((item) => item.id)}
        multiple={multiple}
        onOk={(files) => {
          if (files.length > 0) {
            const file = files[0];
            const acquire: model.Acquire = {
              id: file.id,
              typeName: typeName,
              code: file.code,
              name: file.name,
              enable: true,
            };
            props.executor.acquires.push(acquire);
            setAcquires([...props.executor.acquires]);
          }
          setCenter(<></>);
        }}
        onCancel={() => setCenter(<></>)}
      />,
    );
  };
  const openCollection = (typeName: string) => {
    setCenter(
      <CollectionTable
        multiple={true}
        space={props.work.directory.target.space}
        finished={(coll) => {
          console.log(coll);
          if (coll && Array.isArray(coll)) {
            for (const item of coll) {
              const acquire: model.Acquire = {
                id: generateUuid(),
                typeName: typeName,
                code: item.id,
                name: item.alias,
                enable: true,
              };
              props.executor.acquires.push(acquire);
              setAcquires([...props.executor.acquires]);
            }
          }
          setCenter(<></>);
        }}
      />,
    );
  };
  return (
    <>
      <Modal
        width={1200}
        bodyStyle={{ height: '60vh' }}
        title={'迁移配置'}
        open
        onOk={props.finished}
        onCancel={props.finished}>
        <Table
          rowKey={'typeName'}
          size="small"
          columns={[
            { key: 'typeName', title: '迁移类型', render: (item) => item.typeName },
            {
              title: '迁移项数量',
              render: (item) => {
                return acquires.filter((i) => i.typeName == item.typeName).length;
              },
            },
            {
              key: 'operate',
              title: '操作',
              render: (_, row) => {
                let binding = <></>;
                switch (row.typeName) {
                  case '标准':
                    binding = (
                      <a onClick={() => openSelect(row.typeName, ['目录'])}>添加</a>
                    );
                    break;
                  case '应用':
                    binding = (
                      <a onClick={() => openSelect(row.typeName, ['应用'])}>添加</a>
                    );
                    break;
                  case '资产':
                    binding = (
                      <a
                        onClick={() => {
                          props.executor.acquires.push(
                            {
                              id: generateUuid(),
                              typeName: row.typeName,
                              name: '资产',
                              code: '_system-things',
                              enable: true,
                            },
                            {
                              id: generateUuid(),
                              typeName: row.typeName,
                              name: '资产的变更明细',
                              code: '_system-things-changed',
                              enable: true,
                            },
                            {
                              id: generateUuid(),
                              typeName: row.typeName,
                              code: '_system-things-snapshot',
                              name: '资产的快照（单个）',
                              enable: true,
                            },
                            {
                              id: generateUuid(),
                              typeName: row.typeName,
                              code: '_system-things_{period}',
                              name: '资产的月快照（批量）',
                              enable: true,
                            },
                          );
                          setAcquires([...props.executor.acquires]);
                        }}>
                        生成资产模板
                      </a>
                    );
                    break;
                  case '财务':
                    binding = (
                      <a
                        onClick={() => {
                          props.executor.acquires.push(
                            {
                              id: generateUuid(),
                              typeName: row.typeName,
                              name: '财务结账科目项模板',
                              code: 'financial-closing-options',
                              enable: true,
                            },
                            {
                              id: generateUuid(),
                              typeName: row.typeName,
                              name: '财务结账科目项',
                              code: 'financial-closing',
                              enable: true,
                            },
                            {
                              id: generateUuid(),
                              typeName: row.typeName,
                              code: 'financial-period',
                              name: '财务账期',
                              enable: true,
                            },
                            {
                              id: generateUuid(),
                              typeName: row.typeName,
                              code: 'financial-query',
                              name: '财务总账查询方案',
                              enable: true,
                            },
                          );
                          setAcquires([...props.executor.acquires]);
                        }}>
                        生成财务模板
                      </a>
                    );
                    break;
                  case '办事':
                    binding = (
                      <Space>
                        <a onClick={() => openSelect(row.typeName, ['表单'], true)}>
                          按表单迁移
                        </a>
                        <a onClick={() => openCollection(row.typeName)}>按集合迁移</a>
                      </Space>
                    );
                    break;
                }
                return binding;
              },
            },
          ]}
          expandable={{
            expandedRowRender: (row) => {
              switch (row.typeName) {
                case '标准':
                case '应用':
                case '财务':
                case '资产':
                case '办事':
                  return (
                    <Table
                      rowKey={'id'}
                      size="small"
                      columns={[
                        { key: 'code', title: '编码', dataIndex: 'code', width: 300 },
                        { key: 'name', title: '名称', dataIndex: 'name', width: 300 },
                        {
                          key: 'enable',
                          title: '是否迁移',
                          dataIndex: 'enable',
                          render: (_, item) => {
                            return (
                              <Checkbox
                                checked={item.enable}
                                onChange={(v) => {
                                  updateChecked(item.id, v.target.checked);
                                }}
                              />
                            );
                          },
                        },
                        {
                          key: 'operate',
                          title: '操作',
                          render: (_, item) => {
                            return (
                              <a
                                onClick={() => {
                                  props.executor.acquires =
                                    props.executor.acquires.filter(
                                      (i) => i.id != item.id,
                                    );
                                  setAcquires([...props.executor.acquires]);
                                }}>
                                删除
                              </a>
                            );
                          },
                        },
                      ]}
                      dataSource={acquires.filter(
                        (item) => item.typeName == row.typeName,
                      )}
                      pagination={false}
                    />
                  );
              }
            },
          }}
          pagination={false}
          dataSource={[
            {
              typeName: '标准',
            },
            {
              typeName: '应用',
            },
            {
              typeName: '资产',
            },
            {
              typeName: '财务',
            },
            {
              typeName: '办事',
            },
          ]}
        />
      </Modal>
      {center}
    </>
  );
};

interface ChangeProps {
  work: IWork;
  executor: model.Executor;
  deleteFuc: (id: string) => void;
}

const FieldChange: React.FC<ChangeProps> = (props) => {
  const forms = [...props.work.detailForms, ...props.work.primaryForms];
  const [formId, setFormId] = useState<string>();
  const [changes, setChanges] = useState(props.executor.changes);
  return (
    <Common
      {...props}
      extra={[
        <SelectBox
          key="selectBox"
          width={150}
          showClearButton
          style={{ display: 'inline-block' }}
          value={formId}
          displayExpr={'text'}
          valueExpr={'value'}
          dataSource={forms
            .filter((form) => {
              return props.executor.changes
                .map((change) => change.id)
                .every((formId) => formId != form.id);
            })
            .map((item) => {
              return { text: item.name, value: item.id };
            })}
          onValueChange={(e) => {
            setFormId(e);
          }}
        />,
        <a
          key={'add'}
          onClick={() => {
            if (formId) {
              props.executor.changes.push({
                id: formId,
                name: forms.find((item) => item.id == formId)?.name || '',
                fieldChanges: [],
              });
              setChanges([...props.executor.changes]);
            }
          }}>
          添加
        </a>,
      ]}>
      <FormChangesTable
        work={props.work}
        changes={changes}
        onDel={(formChange: model.FormChange) => {
          props.executor.changes = props.executor.changes.filter(
            (item) => item.id != formChange.id,
          );
          setChanges([...props.executor.changes]);
        }}
      />
    </Common>
  );
};

interface FormChangesProps {
  work: IWork;
  changes: model.FormChange[];
  onDel: (change: model.FormChange) => void;
}

const FormChangesTable: React.FC<FormChangesProps> = (props) => {
  const [center, setCenter] = useState(<></>);
  return (
    <Space style={{ width: '100%' }} direction="vertical">
      {props.changes.map((item, index) => {
        return (
          <div
            style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}
            key={index}>
            <span>{item.name}</span>
            <Space>
              <span>已设置变更字段 {item.fieldChanges.length} 个</span>
              <a
                onClick={() => {
                  setCenter(
                    <FieldChangeTable
                      work={props.work}
                      formChange={item}
                      finished={() => setCenter(<></>)}
                    />,
                  );
                }}>
                编辑变更字段
              </a>
              <AiOutlineCloseCircle
                className={cls.closeIcon}
                onClick={() => props.onDel(item)}
              />
            </Space>
          </div>
        );
      })}
      {center}
    </Space>
  );
};

interface FieldChangeTableProps {
  work: IWork;
  formChange: model.FormChange;
  finished: () => void;
}

const FieldChangeTable: React.FC<FieldChangeTableProps> = (props) => {
  const [fieldChanges, setFieldChanges] = useState(props.formChange.fieldChanges);
  const [center, setCenter] = useState(<></>);
  return (
    <>
      <Modal
        open={true}
        title={'配置变更字段'}
        maskClosable
        width={1200}
        bodyStyle={{
          maxHeight: '100vh',
        }}
        destroyOnClose
        onCancel={() => props.finished()}
        onOk={() => props.finished()}>
        <Space style={{ width: '100%' }} direction={'vertical'}>
          <Space>
            <Button
              onClick={() =>
                setCenter(
                  <ExecutorForm
                    work={props.work}
                    formChange={props.formChange}
                    onFinished={() => setCenter(<></>)}
                    onSave={(fieldChange) => {
                      props.formChange.fieldChanges.push(fieldChange);
                      setFieldChanges([...props.formChange.fieldChanges]);
                    }}
                  />,
                )
              }>
              新增值变更记录
            </Button>
          </Space>
          <ProTable<model.FieldChange>
            search={false}
            options={false}
            tableAlertRender={false}
            dataSource={fieldChanges}
            columns={[
              ...changeRecords,
              {
                title: '操作',
                valueType: 'option',
                render: (_, entity) => {
                  return (
                    <a
                      onClick={() => {
                        props.formChange.fieldChanges =
                          props.formChange.fieldChanges.filter(
                            (item) => item.id != entity.id,
                          );
                        setFieldChanges([...props.formChange.fieldChanges]);
                      }}>
                      删除
                    </a>
                  );
                },
              },
            ]}
          />
        </Space>
      </Modal>
      {center}
    </>
  );
};

interface FieldChangeFormProps {
  work: IWork;
  formChange: model.FormChange;
  onSave: (fieldChange: model.FieldChange) => void;
  onFinished: () => void;
}

export const changeRecords: any = [
  {
    title: '序号',
    valueType: 'index',
  },
  {
    title: '字段主键',
    valueType: 'text',
    dataIndex: 'id',
  },
  {
    title: '字段名称',
    valueType: 'text',
    dataIndex: 'name',
  },
  {
    title: '字段类型',
    valueType: 'text',
    dataIndex: 'valueType',
  },
  {
    title: '变动前值',
    valueType: 'text',
    dataIndex: 'before',
  },
  {
    title: '变动前名称',
    valueType: 'text',
    dataIndex: 'beforeName',
  },
  {
    title: '变动后值',
    valueType: 'text',
    dataIndex: 'after',
  },
  {
    title: '变动后名称',
    valueType: 'text',
    dataIndex: 'afterName',
  },
];

const ExecutorForm: React.FC<FieldChangeFormProps> = (props) => {
  const formRef = useRef<ProFormInstance>();
  const forms = [...props.work.detailForms, ...props.work.primaryForms];
  const form = forms.find((form) => form.id == props.formChange.id);
  const [fields, setFields] = useState<model.FieldModel[]>(form?.fields || []);
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);
  const options = useRef<schema.XAttributeProps>();
  useEffect(() => {
    form?.loadContent().then(() => setFields(form.fields));
  }, []);
  if (!form) {
    return (
      <Modal
        open={open}
        title={'未获取到表单'}
        maskClosable
        width={800}
        destroyOnClose
        onCancel={() => setOpen(false)}
        onOk={() => setOpen(false)}>
        <Empty>未获取到表单</Empty>
      </Modal>
    );
  }
  const setField = (field: FieldModel, fieldName: string, value: any) => {
    formRef.current?.setFieldValue(fieldName, value);
    switch (field.valueType) {
      case '选择型':
      case '分类型':
      case '附件型': {
        const lookup = field.lookups?.find((item) => value == item.value);
        formRef.current?.setFieldValue(fieldName + 'Name', lookup?.text);
        break;
      }
      case '描述型':
      case '数值型':
      case '日期型':
      case '时间型':
        formRef.current?.setFieldValue(fieldName + 'Name', value);
        break;
      case '用户型':
        formRef.current?.setFieldValue(fieldName + 'Name', ShareIdSet.get(value)?.name);
        break;
    }
  };
  const cloneField = (field: model.FieldModel) => {
    const clone = deepClone(field);
    clone.options = clone.options ?? {};
    clone.options.hideField = false;
    clone.options.readOnly = false;
    return clone;
  };
  return (
    <>
      <SchemaForm<model.FieldChange>
        open
        title={'字段变更'}
        width={640}
        formRef={formRef}
        columns={[
          {
            title: '字段主键',
            dataIndex: 'id',
            valueType: 'select',
            readonly: true,
            formItemProps: {
              rules: [{ required: true, message: '字段名称为必填项' }],
            },
          },
          {
            title: '字段名称',
            dataIndex: 'name',
            valueType: 'select',
            formItemProps: {
              rules: [{ required: true, message: '字段名称为必填项' }],
            },
            fieldProps: {
              options: fields.map((i) => {
                return {
                  value: i.id,
                  label: i.name,
                  content: i,
                };
              }),
              onSelect: (_: string, value: any) => {
                formRef.current?.setFieldValue('id', value.value);
                formRef.current?.setFieldValue('name', value.label);
                formRef.current?.setFieldValue('valueType', value.content.valueType);
              },
            },
          },
          {
            title: '字段类型',
            dataIndex: 'valueType',
            readonly: true,
            formItemProps: {
              rules: [{ required: true, message: '字段类型为必填项' }],
            },
          },
          {
            title: '变动前值',
            dataIndex: 'before',
            colProps: { span: 24 },
            renderFormItem: (_) => {
              const id = formRef.current?.getFieldValue('id');
              const field = fields.find((item) => item.id == id);
              if (field) {
                field.options?.hideField && (field.options.hideField = false);
                const clone = cloneField(field);
                return (
                  <FormItem
                    data={{}}
                    numStr={'一列'}
                    notifyEmitter={new Emitter()}
                    field={clone}
                    belong={props.work.directory.target.space}
                    onValuesChange={(_, value) => setField(clone, 'before', value)}
                    rules={[]}
                    form={form.metadata}
                  />
                );
              }
              return <></>;
            },
          },
          {
            title: '变动前名称',
            dataIndex: 'beforeName',
            colProps: { span: 24 },
            readonly: true,
            renderFormItem: (_) => {
              return <>{formRef.current?.getFieldValue('beforeName')}</>;
            },
          },
          {
            title: '变动后值',
            dataIndex: 'after',
            colProps: { span: 24 },
            formItemProps: {
              rules: [{ required: true, message: '变动后值为必填项' }],
            },
            renderFormItem: (_) => {
              const current = props.work.directory.target.space.financial.current;
              const id = formRef.current?.getFieldValue('id');
              const field = fields.find((item) => item.id == id);
              if (field) {
                const clone = cloneField(field);
                const Default: React.FC = () => {
                  let children: ReactNode | undefined;
                  const setValues = (after: any, afterName?: string) => {
                    setField(clone, 'after', after);
                    setField(clone, 'afterName', afterName);
                  };
                  switch (field.options?.defaultType) {
                    case 'currentPeriod':
                      children = (
                        <Checkbox
                          checked={checked}
                          onChange={(e) => {
                            setChecked(e.target.checked);
                            if (e.target.checked) {
                              setValues(current, '当前业务账期');
                            } else {
                              setValues(undefined, undefined);
                            }
                          }}>
                          使用当前业务账期
                        </Checkbox>
                      );
                      break;
                    default:
                      if (field.options?.defaultValue) {
                        children = (
                          <Checkbox
                            checked={checked}
                            onChange={(e) => {
                              setChecked(e.target.checked);
                              if (e.target.checked) {
                                const value = field.options?.defaultValue;
                                setValues(field.options?.defaultValue, value);
                              } else {
                                setValues(undefined, undefined);
                              }
                            }}>
                            使用默认值
                          </Checkbox>
                        );
                      }
                  }
                  if (children) {
                    options.current = field.options;
                    return <div style={{ marginTop: 10 }}> {children} </div>;
                  }
                  options.current = undefined;
                  return <></>;
                };
                return (
                  <>
                    <FormItem
                      data={{}}
                      numStr={'一列'}
                      notifyEmitter={new Emitter()}
                      field={clone}
                      belong={props.work.directory.target.space}
                      onValuesChange={(_, value) => setField(clone, 'after', value)}
                      rules={[]}
                      form={form.metadata}
                    />
                    <Default />
                  </>
                );
              }
              return <></>;
            },
          },
          {
            title: '变动后名称',
            dataIndex: 'afterName',
            colProps: { span: 24 },
            readonly: true,
            renderFormItem: (_) => {
              return <>{formRef.current?.getFieldValue('afterName')}</>;
            },
          },
        ]}
        rowProps={{
          gutter: [24, 0],
        }}
        layoutType="ModalForm"
        onOpenChange={(open: boolean) => {
          if (!open) {
            props.onFinished();
          }
        }}
        onFinish={async (values) => {
          values.options = options.current;
          if (values) {
            props.onSave(values);
          }
          props.onFinished();
        }}
      />
      {}
    </>
  );
};

export const Webhook: React.FC<ExecutorProps> = (props) => {
  const [hookUrl, setHookUrl] = useState(props.executor.hookUrl);
  return (
    <Common executor={props.executor} deleteFuc={props.deleteFuc}>
      <Space style={{ width: '100%' }} direction="vertical">
        <span>用于对接外部系统，审批通过后会发送流程信息到指定地点。</span>
        <Input
          placeholder="输入请求地址"
          value={hookUrl}
          onChange={(e) => {
            props.executor.hookUrl = e.target.value;
            setHookUrl(e.target.value);
          }}
        />
      </Space>
    </Common>
  );
};

export default ExecutorShowComp;
