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
  Button,
  Card,
  DatePicker,
  Form as AntForm,
  Select,
  Space,
  Tag,
  Tooltip,
} from 'antd';
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import cls from './index.module.less';
import { Closing } from './widgets/closing';
import Depreciation from './widgets/depreciation';
import AssetLedger from './widgets/ledger';
import FormItem from 'antd/lib/form/FormItem';

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
                await financial.generateSnapshot(metadata.initialized!);
                await financial.generatePeriod(
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
                financial.initialize(month.current);
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
  const [depreciation, setDepreciation] = useState(
    financial.yearAverage ?? ({} as schema.YearAverage),
  );
  const [speciesItems, setSpeciesItems] = useState<schema.XSpeciesItem[]>([]);
  const loadSpeciesItems = (depreciationMethod: schema.XProperty) => {
    if (depreciationMethod) {
      if (depreciationMethod.speciesId) {
        financial
          .loadSpeciesItems(depreciationMethod.speciesId)
          .then((data) => setSpeciesItems(data));
      }
    }
  };
  const onSelect = (key: string) => {
    setCenter(
      <OpenFileDialog
        accepts={['数值型']}
        rootKey={financial.space.directory.key}
        onOk={(files: IFile[]) => {
          if (files) {
            const property = files[0].metadata as schema.XProperty;
            setDepreciation({ ...depreciation, [key]: property });
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
            setDepreciation({ ...depreciation, depreciationMethod: property });
            loadSpeciesItems(property);
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
    loadSpeciesItems(depreciation.depreciationMethod);
  }, []);
  return (
    <FullScreen
      title={'折旧模板配置'}
      onFinished={onFinished}
      onSave={async () => {
        await financial.setYearAverage(depreciation);
        onFinished();
      }}>
      <AntForm>
        <Card title="平均年限法">
          <Card title={'公式定义'}>
            <Space direction="vertical">
              <Space>
                <FormItem name="depreciationMethod">
                  <FieldText
                    field="depreciationMethod"
                    value="折旧方式"
                    onSelect={onMethodSelected}
                    depreciation={depreciation}
                  />
                </FormItem>
                <SymbolText value="=" />
                <FormItem label="">
                  <Select
                    style={{ width: 200 }}
                    placeholder="选择折旧方式"
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
                <FieldText
                  field="netWorth"
                  value="净值"
                  onSelect={onSelect}
                  depreciation={depreciation}
                />
                <SymbolText value="=" />
                <FieldText
                  field="originalValue"
                  value="原值"
                  onSelect={onSelect}
                  depreciation={depreciation}
                />
                <SymbolText value="-" />
                <FieldText
                  field="monthlyDepreciationAmount"
                  value="累计折旧"
                  onSelect={onSelect}
                  depreciation={depreciation}
                />
              </Space>
              <Space>
                <FieldText
                  field="monthlyDepreciationAmount"
                  value="月折旧额"
                  onSelect={onSelect}
                  depreciation={depreciation}
                />
                <SymbolText value="=" />
                <FieldText
                  field="originalValue"
                  value="原值"
                  onSelect={onSelect}
                  depreciation={depreciation}
                />
                <SymbolText value="/" />
                <FieldText
                  field="usefulLife"
                  value="使用年限"
                  onSelect={onSelect}
                  depreciation={depreciation}
                />
              </Space>
              <Space>
                <FieldText
                  field="monthlyDepreciationAmount"
                  value="累计折旧"
                  onSelect={onSelect}
                  depreciation={depreciation}
                />
                <SymbolText value="=" />
                <FieldText
                  field="monthlyDepreciationAmount"
                  value="累计折旧"
                  onSelect={onSelect}
                  depreciation={depreciation}
                />
                <SymbolText value="+" />
                <FieldText
                  field="monthlyDepreciationAmount"
                  value="月折旧额"
                  onSelect={onSelect}
                  depreciation={depreciation}
                />
              </Space>
              <Space>
                <FieldText
                  field="accruedMonths"
                  value="已计提月份"
                  onSelect={onSelect}
                  depreciation={depreciation}
                />
                <SymbolText value="=" />
                <FieldText
                  field="accruedMonths"
                  value="已计提月份"
                  onSelect={onSelect}
                  depreciation={depreciation}
                />
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
  field: keyof schema.YearAverage | 'number';
  value: string;
  depreciation: schema.YearAverage;
  onSelect: (key: string) => void;
}

export const FieldText: React.FC<DesignProps> = (props) => {
  return (
    <Tooltip title={props.value}>
      <div
        style={{ width: 200 }}
        className={cls.designText}
        onClick={() => props.onSelect(props.field)}>
        <div className={cls.textOverflow}>{props.value}</div>
        {props.field == 'number' || props.depreciation[props.field] ? (
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
  const [center, setCenter] = useState(<></>);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const id = financial.subscribe(() => {
      financial.loadPeriods().then((data) => setPeriods([...data]));
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
              title: '快照',
              valueType: 'text',
              render(_, item) {
                return (
                  <Space>
                    <a
                      onClick={() => {
                        setCenter(
                          <OpenFileDialog
                            accepts={['表单']}
                            rootKey={financial.space.key}
                            onOk={(files) => {
                              if (files.length > 0) {
                                const file = files[0];
                                const form = deepClone(file.metadata as schema.XForm);
                                form.collName = '_system-things_' + item.period;
                                setCenter(
                                  <FormView
                                    form={new Form(form, file.directory)}
                                    finished={() => setCenter(<></>)}
                                  />,
                                );
                              }
                            }}
                            onCancel={() => setCenter(<></>)}
                          />,
                        );
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
                          <AssetLedger financial={financial} period={entity} />
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
                              <Depreciation financial={financial} />
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
                          await financial.generateSnapshot(item.period);
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
