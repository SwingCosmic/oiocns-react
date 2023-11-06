import { schema } from '@/ts/base';
import { lodopCheck, printByLodop } from '@/utils/lodop/useLodop';
import { LoadingOutlined } from '@ant-design/icons';
import { Button, Col, Row, Space, message } from 'antd';
import html2canvas from 'html2canvas';
import React, { useState } from 'react';
import { defineElement } from '../../defineElement';
import cls from './index.module.less';
import { data, hasPrefix, label, length, noTip, valueType } from './type';
import BusinessCard from '/img/businessCard.png';

export default defineElement({
  render(props, ctx) {
    const [loading, setLoading] = useState(false);
    const [number, setNumber] = useState(0);
    let data: schema.XThing[] = [];
    let toolBar = <></>;
    if (ctx.view.mode == 'design') {
      data.push({} as schema.XThing);
    } else {
      data.push(...(ctx.data?.things ?? []));
      toolBar = (
        <Space>
          <Button
            icon={loading ? <LoadingOutlined /> : <></>}
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              const url = await lodopCheck();
              if (url) {
                setLoading(false);
                message.error('检测到未安装 Lodop 组件，请先安装！');
                window.open(url);
                return;
              }
              const elements: string[] = [];
              for (let index = 0; index < data.length; index++) {
                setNumber(index + 1);
                const item = data[index];
                const element = document.getElementById(item.id);
                if (element) {
                  const canvas = await html2canvas(element);
                  elements.push(canvas.toDataURL('image/jpeg', 1.0));
                }
              }
              await printByLodop(elements, 'IMG', '卡片打印', 'A4');
              setLoading(false);
              setNumber(0);
            }}>
            {loading ? `打印中（${number}/${data.length}）` : '打印'}
          </Button>
        </Space>
      );
    }
    return (
      <div className={cls.container}>
        {toolBar}
        <div className={cls.cards}>
          <Row justify={'center'} gutter={[16, 16]}>
            {data.map((item, index) => {
              return (
                <Col key={index}>
                  <div
                    id={item.id}
                    style={{
                      width: props.width,
                      height: props.height,
                      boxShadow: '0px 0px 5px 0px #d8d8d8',
                      display: 'flex',
                    }}>
                    <div className={cls.qrUnit}>
                      <div style={{ margin: props.qrMargin }}>
                        {props.qrCode?.({
                          width: props.qrWidth ?? 80,
                          height: props.qrWidth ?? 80,
                          data: item,
                          label: '二维码',
                          valueType: 'QrCode',
                        })}
                      </div>
                      <div style={{ margin: props.belongMargin, wordWrap: 'normal' }}>
                        {props.belongName?.({
                          width: props.belongWidth,
                          data: item,
                          label: '归属',
                          valueType: 'Belong',
                        })}
                      </div>
                    </div>
                    <div
                      className={cls.fields}
                      style={{
                        margin: props.fieldsMargin,
                      }}>
                      {props.first?.({
                        data: item,
                        label: '字段一',
                        hasPrefix: true,
                        noTip: true,
                      })}
                      {props.second?.({
                        data: item,
                        label: '字段二',
                        hasPrefix: true,
                        noTip: true,
                      })}
                      {props.third?.({
                        data: item,
                        label: '字段三',
                        hasPrefix: true,
                        noTip: true,
                      })}
                      {props.fourth?.({
                        data: item,
                        label: '字段四',
                        hasPrefix: true,
                        noTip: true,
                      })}
                      {props.fifth?.({
                        data: item,
                        label: '字段五',
                        hasPrefix: true,
                        noTip: true,
                      })}
                      {props.sixth?.({
                        data: item,
                        label: '字段六',
                        hasPrefix: true,
                        noTip: true,
                      })}
                      {props.seventh?.({
                        data: item,
                        label: '字段七',
                        hasPrefix: true,
                        noTip: true,
                      })}
                    </div>
                  </div>
                </Col>
              );
            })}
          </Row>
        </div>
      </div>
    );
  },
  displayName: 'PrintCard',
  meta: {
    props: {
      width: {
        type: 'number',
        label: '宽度',
        default: 360,
      },
      height: {
        type: 'number',
        label: '高度',
        default: 200,
      },
      qrMargin: {
        type: 'number',
        label: '二维码外边距',
        default: 8,
      },
      qrWidth: {
        type: 'number',
        label: '二维码宽度',
        default: 140,
      },
      belongMargin: {
        type: 'number',
        label: '归属外边距',
        default: 8,
      },
      belongWidth: {
        type: 'number',
        label: '归属宽度',
        default: 140,
      },
      fieldsMargin: {
        type: 'number',
        label: '字段外边距',
        default: 8,
      },
    },
    slots: {
      qrCode: {
        label: '实体二维码',
        single: true,
        params: { data, label, valueType, width: length, height: length },
        default: 'Field',
      },
      belongName: {
        label: '归属',
        single: true,
        params: { data, label, valueType, width: length },
        default: 'Field',
      },
      first: {
        label: '字段一',
        single: true,
        params: { data, label, hasPrefix, noTip },
        default: 'Field',
      },
      second: {
        label: '字段二',
        single: true,
        params: { data, label, hasPrefix, noTip },
        default: 'Field',
      },
      third: {
        label: '字段三',
        single: true,
        params: { data, label, hasPrefix, noTip },
        default: 'Field',
      },
      fourth: {
        label: '字段四',
        single: true,
        params: { data, label, hasPrefix, noTip },
        default: 'Field',
      },
      fifth: {
        label: '字段五',
        single: true,
        params: { data, label, hasPrefix, noTip },
        default: 'Field',
      },
      sixth: {
        label: '字段六',
        single: true,
        params: { data, label, hasPrefix, noTip },
        default: 'Field',
      },
      seventh: {
        label: '字段七',
        single: true,
        params: { data, label, hasPrefix, noTip },
        default: 'Field',
      },
    },
    label: '打印模板',
    type: 'Print',
    description: '用于打印卡片信息内容',
    photo: BusinessCard,
    layoutType: 'full',
  },
});
