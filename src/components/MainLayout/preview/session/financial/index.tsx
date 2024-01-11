import { command } from '@/ts/base';
import { TargetType, IFinancial, IBelong } from '@/ts/core';
import { IPeriod } from '@/ts/core/financial/period';
import { belongTypes } from '@/ts/core/public/consts';
import { Button, Card, DatePicker, Space, Tag } from 'antd';
import { ScrollView } from 'devextreme-react';
import dxScrollView from 'devextreme/ui/scroll_view';
import React, { useEffect, useRef, useState } from 'react';

interface IProps {
  financial: IFinancial;
}

const Financial: React.FC<IProps> = ({ financial }) => {
  const [metadata, setMetadata] = useState(financial.metadata);
  const month = useRef<string>();
  useEffect(() => {
    const id = financial.subscribe(() => setMetadata(financial.metadata));
    return () => command.unsubscribeByFlag(id);
  }, []);
  const Center = () => {
    if (metadata && Object.keys(metadata).length > 0) {
      return (
        <Space>
          <Tag color="green">已初始化</Tag>
          <Card>{'初始结账日期：' + (metadata?.initializedPeriod ?? '')}</Card>
          <Card>{'当前业务时间：' + (metadata?.currentPeriod ?? '')}</Card>
          <Button onClick={() => financial.generatePeriod()}>生成期初账期</Button>
          <Button onClick={() => financial.clear()}>清空初始化</Button>
        </Space>
      );
    } else {
      return (
        <Space>
          <Tag color={'red'}>未初始化</Tag>
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
  return <Card title={'初始化账期'}>{<Center />}</Card>;
};

const Periods: React.FC<IProps> = ({ financial }) => {
  const loadMorePeriods = async (component: dxScrollView | undefined) => {
    const news = await financial.loadPeriods(10);
    if (news.length > 0) {
      financial.changCallback();
    }
    if (component) {
      await component.release(news.length < 10);
    }
  };
  return (
    <ScrollView
      bounceEnabled
      width={'100%'}
      reachBottomText="加载更多..."
      onReachBottom={(e) => loadMorePeriods(e.component)}
      onInitialized={(e) => loadMorePeriods(e.component)}>
      <Card></Card>
    </ScrollView>
  );
};

interface PeriodProps {
  period: IPeriod;
}

const Period: React.FC<IProps> = () => {
  return <></>;
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
