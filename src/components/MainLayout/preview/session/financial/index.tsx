import FullScreenModal from '@/components/Common/fullScreen';
import OpenFileDialog from '@/components/OpenFileDialog';
import FormView from '@/executor/open/form';
import { model, schema } from '@/ts/base';
import { deepClone } from '@/ts/base/common';
import { IBelong, IFile, IFinancial, TargetType } from '@/ts/core';
import { IPeriod } from '@/ts/core/work/financial/period';
import { ProTable } from '@ant-design/pro-components';
import { Button, Card, DatePicker, Select, Space, Table, Tag, Tooltip } from 'antd';
import React, { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import Depreciation from './widgets/depreciation';
import { Closing } from './widgets/closing';
import AssetLedger from './widgets/ledger';
import { Form } from '@/ts/core/thing/standard/form';
import cls from './index.module.less';

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
  onFinished: () => void;
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
      onCancel={props.onFinished}>
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
  const onSelect = (key: string) => {
    setCenter(
      <OpenFileDialog
        accepts={['数值型']}
        rootKey={financial.space.key}
        onOk={(files: IFile[]) => {
          if (files) {
            const property = files[0].metadata as schema.XProperty;
            setDepreciation({ ...depreciation, [key]: property });
          }
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
        rootKey={financial.space.key}
        onOk={(files: IFile[]) => {
          if (files.length > 0) {
            const property = files[0].metadata as schema.XProperty;
            setDepreciation({ ...depreciation, depreciationMethod: property });
          }
        }}
        onCancel={function (): void {
          setCenter(<></>);
        }}
      />,
    );
  };
  return (
    <FullScreen title={'折旧模板配置'} onFinished={onFinished}>
      <Card title="平均年限法">
        <Space style={{ width: '100%' }} direction="vertical">
          <Card title={'折旧方式绑定'}>
            <Space>
              <FieldText
                key="depreciationMethod"
                value="折旧方式属性"
                onSelect={onMethodSelected}
              />
              折旧方式: <Select />
            </Space>
          </Card>
          <Card title={'公式定义'}>
            <Space direction="vertical">
              <Space>
                <FieldText key="netWorth" value="净值" onSelect={onSelect} />
                <SymbolText value="=" />
                <FieldText key="originalValue" value="原值" onSelect={onSelect} />
                <SymbolText value="-" />
                <FieldText
                  key="monthlyDepreciationAmount"
                  value="累计折旧"
                  onSelect={onSelect}
                />
              </Space>
              <Space>
                <FieldText
                  key="monthlyDepreciationAmount"
                  value="月折旧额"
                  onSelect={onSelect}
                />
                <SymbolText value="=" />
                <FieldText key="originalValue" value="原值" onSelect={onSelect} />
                <SymbolText value="/" />
                <FieldText key="usefulLife" value="使用年限" onSelect={onSelect} />
              </Space>
              <Space>
                <FieldText
                  key="monthlyDepreciationAmount"
                  value="累计折旧"
                  onSelect={onSelect}
                />
                <SymbolText value="=" />
                <FieldText
                  key="monthlyDepreciationAmount"
                  value="累计折旧"
                  onSelect={onSelect}
                />
                <SymbolText value="+" />
                <FieldText
                  key="monthlyDepreciationAmount"
                  value="月折旧额"
                  onSelect={onSelect}
                />
              </Space>
              <Space>
                <FieldText key="accruedMonths" value="已计提月份" onSelect={onSelect} />
                <SymbolText value="=" />
                <FieldText key="accruedMonths" value="已计提月份" onSelect={onSelect} />
                <SymbolText value="+" />
                <FieldText key="number" value="1" onSelect={() => {}} />
              </Space>
            </Space>
          </Card>
        </Space>
      </Card>
      {center}
    </FullScreen>
  );
};

interface DesignProps {
  key: string;
  value: string;
  onSelect: (key: string) => void;
}

export const FieldText: React.FC<DesignProps> = (props) => {
  return (
    <Tooltip title={props.value} key={props.key}>
      <div
        style={{ width: 200, height: '100%' }}
        className={cls.designText}
        onClick={() => props.onSelect(props.key)}>
        <div className={cls.textOverflow}>{props.value}</div>
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
  finished: () => void;
}

const NullableFinancial: React.FC<FinancialProps> = ({ belong, finished }) => {
  if ([TargetType.Company, TargetType.Person].includes(belong.typeName as TargetType)) {
    return (
      <FullScreen title={'财务管理'} onFinished={finished}>
        <Space style={{ width: '100%' }} direction="vertical">
          <Financial financial={belong.financial} />
          <Periods financial={belong.financial} />
        </Space>
      </FullScreen>
    );
  }
  return <></>;
};

export default NullableFinancial;
