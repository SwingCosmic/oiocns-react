import { command } from '@/ts/base';
import { IBelong, IFinancial, TargetType } from '@/ts/core';
import { IPeriod } from '@/ts/core/financial/period';
import { belongTypes } from '@/ts/core/public/consts';
import { generateUuid } from '@/utils/excel';
import { ProList } from '@ant-design/pro-components';
import { Button, Card, DatePicker, Space, Tag } from 'antd';
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
  const [key, setKey] = useState(generateUuid());
  useEffect(() => {
    const id = financial.subscribe(() => setKey(generateUuid()));
    return () => financial.unsubscribe(id);
  }, []);
  return (
    <Card>
      <ProList<IPeriod>
        key={key}
        pagination={{ pageSize: 10 }}
        request={async (params) => {
          const current = params.current ?? 1;
          const pageSize = params.pageSize ?? 10;
          return financial.loadPeriods((current - 1) * pageSize, pageSize);
        }}
        metas={{
          title: {
            render: (_, record) => {
              return <span>{'账期' + record.metadata.period}</span>;
            },
          },
          avatar: {},
        }}
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
