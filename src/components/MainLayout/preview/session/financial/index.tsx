import FullScreenModal from '@/components/Common/fullScreen';
import OpenFileDialog from '@/components/OpenFileDialog';
import FormView from '@/executor/open/form';
import { schema } from '@/ts/base';
import { deepClone } from '@/ts/base/common';
import { IBelong, IFinancial, TargetType } from '@/ts/core';
import { Form } from '@/ts/core/thing/standard/form';
import { IPeriod } from '@/ts/core/work/financial/period';
import { ProTable } from '@ant-design/pro-components';
import { Button, Card, DatePicker, Space, Tag } from 'antd';
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { Closing } from './widgets/closing';
import Depreciation from './widgets/depreciation';
import Ledger from './widgets/ledger';

interface IProps {
  financial: IFinancial;
}

const Financial: React.FC<IProps> = ({ financial }) => {
  const [metadata, setMetadata] = useState(financial.metadata);
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
    </Card>
  );
};

interface FullProps {
  title: string;
  onFinished?: () => void;
  onSave?: () => void;
  children: ReactNode;
}

export const FullScreen: React.FC<FullProps> = (props) => {
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
