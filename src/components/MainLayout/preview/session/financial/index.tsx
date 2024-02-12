import FullScreenModal from '@/components/Common/fullScreen';
import OpenFileDialog from '@/components/OpenFileDialog';
import FormView from '@/executor/open/form';
import { schema } from '@/ts/base';
import { deepClone } from '@/ts/base/common';
import { IBelong, IFile, IFinancial, TargetType } from '@/ts/core';
import { Form } from '@/ts/core/thing/standard/form';
import { IPeriod } from '@/ts/core/work/financial/period';
import { ProTable } from '@ant-design/pro-components';
import {
  Form as AntForm,
  Button,
  Card,
  DatePicker,
  Select,
  Space,
  Tag,
  Tooltip,
} from 'antd';
import { FormInstance } from 'antd/es/form';
import FormItem from 'antd/lib/form/FormItem';
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import cls from './index.module.less';
import { Closing } from './widgets/closing';
import Depreciation from './widgets/depreciation';
import Ledger from './widgets/ledger';

interface IProps {
  financial: IFinancial;
}

const Financial: React.FC<IProps> = ({ financial }) => {
  const [metadata, setMetadata] = useState(financial.metadata);
  const [center, setCenter] = useState(<></>);
  const month = useRef<string>();
  useEffect(() => {
    const id = financial.subscribe(() => setMetadata({ ...financial.metadata }));
    return () => financial.unsubscribe(id);
  }, []);
  const Center = () => {
    const [loading, setLoading] = useState(false);
    if (metadata?.initialized) {
      return (
        <Space>
          <Card>{'初始结账日期：' + (metadata.initialized ?? '')}</Card>
          <Card>{'当前业务账期：' + (metadata?.current ?? '')}</Card>
          {metadata?.initialized && !financial.current && (
            <Button
              loading={loading}
              onClick={async () => {
                setLoading(true);
                await financial.createSnapshots(metadata.initialized!);
                await financial.createPeriod(
                  financial.getOffsetPeriod(metadata.initialized!, 1),
                );
                setLoading(false);
              }}>
              生成期初账期
            </Button>
          )}
          <Button
            onClick={() =>
              setCenter(
                <DepreciationTemplate
                  financial={financial}
                  onFinished={() => setCenter(<></>)}
                />,
              )
            }>
            折旧模板配置
          </Button>
          <Button onClick={() => financial.clear()}>清空初始化</Button>
        </Space>
      );
    } else {
      return (
        <Space>
          <DatePicker
            style={{ width: '100%' }}
            picker="month"
            onChange={(_, data) => (month.current = data)}
          />
          <Button
            onClick={async () => {
              if (month.current) {
                financial.setInitialize(month.current);
              }
            }}>
            确认
          </Button>
        </Space>
      );
    }
  };
  return (
    <Card
      title={
        <Space>
          {'初始化账期'}
          {metadata?.initialized ? (
            <Tag color="green">已初始化</Tag>
          ) : (
            <Tag color="red">未初始化</Tag>
          )}
        </Space>
      }>
      {<Center />}
      {center}
    </Card>
  );
};

interface FullProps {
  title: string;
  onFinished?: () => void;
  onSave?: () => void;
  children: ReactNode;
}

const FullScreen: React.FC<FullProps> = (props) => {
  return (
    <FullScreenModal
      open
      centered
      fullScreen
      destroyOnClose
      width={'80vw'}
      bodyHeight={'80vh'}
      title={props.title}
      onOk={props.onFinished}
      onCancel={props.onFinished}
      onSave={props.onSave}>
      {props.children}
    </FullScreenModal>
  );
};

interface TemplateProps {
  financial: IFinancial;
  onFinished: () => void;
}

const DepreciationTemplate: React.FC<TemplateProps> = ({ financial, onFinished }) => {
  const [center, setCenter] = useState(<></>);
  const [form] = AntForm.useForm<schema.YearAverage>();
  const [speciesItems, setSpeciesItems] = useState<schema.XSpeciesItem[]>([]);
  const loadSpeciesItems = async (speciesId: string) => {
    const data = await financial.loadSpeciesItems(speciesId);
    setSpeciesItems(data);
  };
  const onSelect = (key: string) => {
    setCenter(
      <OpenFileDialog
        accepts={['数值型']}
        rootKey={financial.space.directory.key}
        onOk={(files: IFile[]) => {
          if (files) {
            const property = files[0].metadata as schema.XProperty;
            form.setFieldValue(key, property);
          }
          setCenter(<></>);
        }}
        onCancel={() => {
          setCenter(<></>);
        }}
      />,
    );
  };
  const onMethodSelected = () => {
    setCenter(
      <OpenFileDialog
        accepts={['选择型', '分类型']}
        rootKey={financial.space.directory.key}
        onOk={(files: IFile[]) => {
          if (files.length > 0) {
            const property = files[0].metadata as schema.XProperty;
            form.setFieldValue('depreciationMethod', property);
            if (property.speciesId) {
              loadSpeciesItems(property.speciesId);
            }
          }
          setCenter(<></>);
        }}
        onCancel={function (): void {
          setCenter(<></>);
        }}
      />,
    );
  };
  useEffect(() => {
    const method = financial.yearAverage?.depreciationMethod;
    if (method && method.speciesId) {
      loadSpeciesItems(method.speciesId);
    }
  }, []);
  return (
    <FullScreen
      title={'折旧模板配置'}
      onFinished={onFinished}
      onSave={async () => {
        form.isFieldsTouched;
        const validated = await form.validateFields();
        await financial.setYearAverage(validated);
        onFinished();
      }}>
      <AntForm<schema.YearAverage> form={form} initialValues={financial.yearAverage}>
        <Card title="平均年限法">
          <Card title={'公式定义'}>
            <Space direction="vertical">
              <Space>
                <FormItem
                  name="depreciationMethod"
                  rules={[{ required: true, message: '请绑定折旧方式！' }]}>
                  <FieldText
                    field="depreciationMethod"
                    label="折旧方式"
                    onSelect={onMethodSelected}
                    form={form}
                  />
                </FormItem>
                <SymbolText value="=" />
                <FormItem
                  name="speciesItemId"
                  rules={[{ required: true, message: '请绑定折旧方法！' }]}>
                  <Select
                    style={{ width: 200 }}
                    placeholder="选择折旧方法"
                    options={speciesItems.map((item) => {
                      return {
                        label: item.name,
                        value: item.id,
                      };
                    })}
                  />
                </FormItem>
              </Space>
              <Space>
                <FormItem
                  name="netWorth"
                  rules={[{ required: true, message: '请绑定净值！' }]}>
                  <FieldText
                    field="netWorth"
                    label="净值"
                    onSelect={onSelect}
                    form={form}
                  />
                </FormItem>
                <SymbolText value="=" />
                <FormItem
                  name="originalValue"
                  rules={[{ required: true, message: '请绑定原值！' }]}>
                  <FieldText
                    field="originalValue"
                    label="原值"
                    onSelect={onSelect}
                    form={form}
                  />
                </FormItem>
                <SymbolText value="-" />
                <FormItem
                  name="monthlyDepreciationAmount"
                  rules={[{ required: true, message: '请绑定累计折旧！' }]}>
                  <FieldText
                    field="monthlyDepreciationAmount"
                    label="累计折旧"
                    onSelect={onSelect}
                    form={form}
                  />
                </FormItem>
              </Space>
              <Space>
                <FormItem
                  name="monthlyDepreciationAmount"
                  rules={[{ required: true, message: '请绑定月折旧额！' }]}>
                  <FieldText
                    field="monthlyDepreciationAmount"
                    label="月折旧额"
                    onSelect={onSelect}
                    form={form}
                  />
                </FormItem>
                <SymbolText value="=" />
                <FormItem
                  name="originalValue"
                  rules={[{ required: true, message: '请绑定原值！' }]}>
                  <FieldText
                    field="originalValue"
                    label="原值"
                    onSelect={onSelect}
                    form={form}
                  />
                </FormItem>
                <SymbolText value="/" />
                <FormItem
                  name="usefulLife"
                  rules={[{ required: true, message: '请绑定使用年限！' }]}>
                  <FieldText
                    field="usefulLife"
                    label="使用年限"
                    onSelect={onSelect}
                    form={form}
                  />
                </FormItem>
              </Space>
              <Space>
                <FormItem
                  name="monthlyDepreciationAmount"
                  rules={[{ required: true, message: '请绑定累计折旧！' }]}>
                  <FieldText
                    field="monthlyDepreciationAmount"
                    label="累计折旧"
                    onSelect={onSelect}
                    form={form}
                  />
                </FormItem>
                <SymbolText value="=" />
                <FormItem
                  name="monthlyDepreciationAmount"
                  rules={[{ required: true, message: '请绑定累计折旧！' }]}>
                  <FieldText
                    field="monthlyDepreciationAmount"
                    label="累计折旧"
                    onSelect={onSelect}
                    form={form}
                  />
                </FormItem>
                <SymbolText value="+" />
                <FormItem
                  name="monthlyDepreciationAmount"
                  rules={[{ required: true, message: '请绑定月折旧额！' }]}>
                  <FieldText
                    field="monthlyDepreciationAmount"
                    label="月折旧额"
                    onSelect={onSelect}
                    form={form}
                  />
                </FormItem>
              </Space>
              <Space>
                <FormItem
                  name="accruedMonths"
                  rules={[{ required: true, message: '请绑定已计提月份！' }]}>
                  <FieldText
                    field="accruedMonths"
                    label="已计提月份"
                    onSelect={onSelect}
                    form={form}
                  />
                </FormItem>
                <SymbolText value="=" />
                <FormItem
                  name="accruedMonths"
                  rules={[{ required: true, message: '请绑定已计提月份！' }]}>
                  <FieldText
                    field="accruedMonths"
                    label="已计提月份"
                    onSelect={onSelect}
                    form={form}
                  />
                </FormItem>
                <SymbolText value="+" />
                <NumberText number={1} />
              </Space>
            </Space>
          </Card>
        </Card>
      </AntForm>
      {center}
    </FullScreen>
  );
};

interface DesignProps {
  field: keyof schema.YearAverage;
  label: string;
  form: FormInstance<schema.YearAverage>;
  onSelect: (key: string) => void;
}

export const FieldText: React.FC<DesignProps> = (props) => {
  return (
    <Tooltip title={props.label}>
      <div
        style={{ width: 200 }}
        className={cls.designText}
        onClick={() => props.onSelect(props.field)}>
        <div className={cls.textOverflow}>{props.label}</div>
        {props.form.getFieldValue(props.field) ? (
          <Tag color="green">已绑定</Tag>
        ) : (
          <Tag color="red">未绑定</Tag>
        )}
      </div>
    </Tooltip>
  );
};

export const NumberText: React.FC<{ number: number }> = (props) => {
  return (
    <Tooltip>
      <div style={{ width: 200 }} className={cls.designText}>
        <div className={cls.textOverflow}>{props.number}</div>
      </div>
    </Tooltip>
  );
};

export const SymbolText: React.FC<{ value: string }> = (props) => {
  return <div style={{ width: 10, textAlign: 'center' }}>{props.value}</div>;
};

const Periods: React.FC<IProps> = ({ financial }) => {
  const [periods, setPeriods] = useState<IPeriod[]>([]);
  const [form, setForm] = useState(financial.form);
  const [center, setCenter] = useState(<></>);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const id = financial.subscribe(async () => {
      setPeriods([...(await financial.loadPeriods())]);
      setForm(await financial.loadForm());
    });
    return () => financial.unsubscribe(id);
  }, []);
  return (
    <>
      <Card title={'结账记录'}>
        <ProTable<IPeriod>
          search={false}
          options={false}
          pagination={{ pageSize: 10 }}
          dataSource={periods}
          columns={[
            {
              title: '序号',
              valueType: 'index',
            },
            {
              title: '期间',
              valueType: 'text',
              dataIndex: 'period',
            },
            {
              title: '是否已折旧',
              valueType: 'text',
              dataIndex: 'deprecated',
              render(_, entity) {
                if (entity.deprecated) {
                  return <Tag color="green">已折旧</Tag>;
                }
                return <Tag color="red">未折旧</Tag>;
              },
            },
            {
              title: '是否已结账',
              valueType: 'text',
              dataIndex: 'closed',
              render(_, entity) {
                if (entity.closed) {
                  return <Tag color="green">已结账</Tag>;
                }
                return <Tag color="red">未结账</Tag>;
              },
            },
            {
              title: '资产负债表',
              valueType: 'text',
              render(_) {
                return <a>查看</a>;
              },
            },
            {
              title: (
                <Space>
                  <span>快照</span>
                  {form && <Tag color="green">{form.name}</Tag>}
                </Space>
              ),
              valueType: 'text',
              render(_, item) {
                return (
                  <Space>
                    <a
                      onClick={() => {
                        if (!form) {
                          setCenter(
                            <OpenFileDialog
                              accepts={['表单']}
                              rootKey={financial.space.key}
                              onOk={(files) => {
                                if (files.length > 0) {
                                  const metadata = files[0].metadata as schema.XForm;
                                  financial.setForm(metadata);
                                }
                                setCenter(<></>);
                              }}
                              onCancel={() => setCenter(<></>)}
                            />,
                          );
                        } else {
                          const metadata = deepClone(form.metadata);
                          metadata.collName = '_system-things_' + item.period;
                          setCenter(
                            <FormView
                              form={new Form(metadata, financial.space.directory)}
                              finished={() => setCenter(<></>)}
                            />,
                          );
                        }
                      }}>
                      查看
                    </a>
                  </Space>
                );
              },
            },
            {
              title: '总账',
              valueType: 'text',
              render(_, entity) {
                return (
                  <a
                    onClick={() => {
                      setCenter(
                        <FullScreen
                          title={entity.period + ' 资产总账'}
                          onFinished={() => setCenter(<></>)}>
                          <Ledger financial={financial} period={entity} />
                        </FullScreen>,
                      );
                    }}>
                    查看
                  </a>
                );
              },
            },
            {
              title: '操作',
              valueType: 'option',
              width: 300,
              render: (_, item) => {
                return (
                  <Space>
                    {!item.deprecated && (
                      <Button
                        type="primary"
                        size="small"
                        onClick={async () =>
                          setCenter(
                            <FullScreen
                              title={'资产折旧'}
                              onFinished={() => setCenter(<></>)}>
                              <Depreciation financial={financial} period={item} />
                            </FullScreen>,
                          )
                        }>
                        发起折旧
                      </Button>
                    )}
                    {item.deprecated && (
                      <Button
                        loading={loading}
                        type="primary"
                        size="small"
                        onClick={async () => {
                          setLoading(true);
                          await financial.createSnapshots(item.period);
                          await item.monthlySettlement();
                          setLoading(false);
                        }}>
                        生成快照
                      </Button>
                    )}
                    {!item.closed && (
                      <Button
                        type="primary"
                        size="small"
                        onClick={async () =>
                          setCenter(
                            <FullScreen
                              title={'月结账'}
                              onFinished={() => setCenter(<></>)}>
                              <Closing financial={financial} />
                            </FullScreen>,
                          )
                        }>
                        发起结账
                      </Button>
                    )}
                  </Space>
                );
              },
            },
          ]}
        />
      </Card>
      {center}
    </>
  );
};

interface FinancialProps {
  belong: IBelong;
}

const BelongFinancial: React.FC<FinancialProps> = ({ belong }) => {
  if ([TargetType.Company, TargetType.Person].includes(belong.typeName as TargetType)) {
    return (
      <Space style={{ width: '100%' }} direction="vertical">
        <Financial financial={belong.financial} />
        <Periods financial={belong.financial} />
      </Space>
    );
  }
  return <></>;
};

export default BelongFinancial;
