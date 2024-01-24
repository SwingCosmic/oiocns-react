import { command } from '@/ts/base';
import { IBelong, IFinancial, TargetType } from '@/ts/core';
import { IPeriod } from '@/ts/core/financial/period';
import { belongTypes } from '@/ts/core/public/consts';
import { generateUuid } from '@/utils/excel';
import { ProTable } from '@ant-design/pro-components';
import { Button, Card, DatePicker, Space, Tag, message } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';

interface IProps {
  financial: IFinancial;
}

const Financial: React.FC<IProps> = ({ financial }) => {
  const [metadata, setMetadata] = useState(financial.metadata);
  const month = useRef<string>();
  const initialized = useMemo(() => {
    return metadata && Object.keys(metadata).length > 0;
  }, [metadata]);
  useEffect(() => {
    const id = financial.subscribe(() => setMetadata(financial.metadata));
    return () => command.unsubscribeByFlag(id);
  }, []);
  const Center = () => {
    if (initialized) {
      return (
        <Space>
          <Card>{'初始结账日期：' + (metadata?.initializedPeriod ?? '')}</Card>
          <Card>{'当前业务时间：' + (metadata?.currentPeriod ?? '')}</Card>
          {!financial.firstGenerated && (
            <Button onClick={() => financial.generatePeriod()}>生成期初账期</Button>
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
          {initialized ? (
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

const Periods: React.FC<IProps> = ({ financial }) => {
  const [periods, setPeriods] = useState<IPeriod[]>([]);
  useEffect(() => {
    const id = financial.subscribe(() => {
      financial.loadPeriods().then((data) => setPeriods(data));
    });
    return () => financial.unsubscribe(id);
  }, []);
  return (
    <Card>
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
            title: '账目平衡',
            valueType: 'text',
            dataIndex: 'closed',
            render(_, entity) {
              if (entity.balanced) {
                return <Tag color="green">已平衡</Tag>;
              }
              return <Tag color="red">未平衡</Tag>;
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
            title: '月快照',
            valueType: 'text',
            dataIndex: 'closed',
            render(_) {
              return <a>查看</a>;
            },
          },
          {
            title: '月总账',
            valueType: 'text',
            dataIndex: 'closed',
            render(_) {
              return <a>查看</a>;
            },
          },
          {
            title: '操作',
            valueType: 'option',
            render: (_, item) => {
              return (
                <Space>
                  {!item.deprecated && (
                    <Button
                      type="primary"
                      size="small"
                      onClick={async () => {
                        await item.calculateDepreciation();
                      }}>
                      发起折旧
                    </Button>
                  )}
                  {!item.closed && (
                    <Button
                      type="primary"
                      size="small"
                      onClick={async () => {
                        await item.trialBalance();
                      }}>
                      试算平衡
                    </Button>
                  )}
                  {!item.closed && (
                    <Button
                      type="primary"
                      size="small"
                      onClick={async () => {
                        try {
                          await item.monthlySettlement();
                        } catch (error) {
                          message.error((error as Error).message);
                        }
                      }}>
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
  );
};

interface FinancialProps {
  belong: IBelong;
}

const NullableFinancial: React.FC<FinancialProps> = ({ belong }) => {
  if (belongTypes.includes(belong.typeName as TargetType)) {
    return (
      <Space style={{ width: '100%' }} direction="vertical">
        <Financial financial={belong.financial} />
        <Periods financial={belong.financial} />
      </Space>
    );
  }
  return <></>;
};

export default NullableFinancial;
