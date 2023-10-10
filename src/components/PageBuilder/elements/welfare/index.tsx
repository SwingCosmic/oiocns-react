import { AiOutlineShoppingCart } from '@/icons/ai';
import { kernel } from '@/ts/base';
import { IForm } from '@/ts/core';
import { ShareIdSet } from '@/ts/core/public/entity';
import { Badge, Button, Col, Pagination, Row, Space, Tag } from 'antd';
import React, { useEffect, useState } from 'react';
import { ExistTypeMeta } from '../../core/ElementMeta';
import { defineElement } from '../defineElement';
import cls from './index.module.less';

export default defineElement({
  render(props, ctx) {
    const form = ShareIdSet.get(props.formId + '*') as IForm | undefined;
    const [data, setData] = useState<any[]>([]);
    const [page, setPage] = useState<number>(1);
    const [size, setSize] = useState<number>(props.pageSize ?? 20);
    const [total, setTotal] = useState<number>(0);
    const [choose, setChoose] = useState<any[]>([]);
    useEffect(() => {
      if (form) {
        Promise.all([form.loadContent, loadData(size, page)]);
      }
    }, []);
    ctx.view.subscribeProps(props.id, (prop, value) =>{
      switch(prop) {
        case "pageSize":
          loadData(value, page);
          break;
      }
    });
    const loadData = async (take: number, page: number) => {
      if (!form) return;
      const res = await kernel.loadThing<any>(form.belongId, [form.belongId], {
        take: take,
        skip: (page - 1) * take,
        requireTotalCount: true,
      });
      setData(res.data.data ?? []);
      setSize(take);
      setPage(page);
      setTotal(res.data.totalCount);
    };
    return (
      <div className={cls.layout}>
        <div className={cls.search}>
          {form?.fields
            .filter((item: any) => ['选择型', '分类型'].indexOf(item.valueType) != -1)
            .map((item) => {
              return (
                <Space key={item.id} direction="horizontal">
                  <Tag color="blue">{item.name}</Tag>
                  {item.lookups?.map((up) => {
                    return <Tag key={up.id}>{up.text}</Tag>;
                  }) ?? <></>}
                </Space>
              );
            })}
        </div>
        <div className={cls.contentData}>
          <div className={cls.contentGrid}>
            <Row gutter={[16, 16]}>
              {data.map((item) => {
                return props.children.map((c) => {
                  // 自递归渲染
                  const Render = ctx.view.components.getComponentRender(
                    c.kind,
                    ctx.view.mode,
                  );
                  return (
                    <Col key={c.id} span={4} className={cls.contentCard}>
                      <Render element={c} data={item} />
                    </Col>
                  );
                });
              })}
            </Row>
          </div>
        </div>
        <div className={cls.contentPage}>
          <Pagination
            current={page}
            pageSize={size}
            total={total}
            onChange={(page, size) => loadData(size, page)}
          />
        </div>
        <div className={cls.shoppingBtn}>
          <Badge count={choose.length}>
            <Button
              size="large"
              type="primary"
              shape="circle"
              icon={<AiOutlineShoppingCart />}
            />
          </Badge>
        </div>
      </div>
    );
  },
  displayName: 'Welfare',
  meta: {
    props: {
      formId: {
        type: 'type',
        label: '关联表单',
        typeName: 'form',
      } as ExistTypeMeta<string | undefined>,
      pageSize: {
        type: 'number',
        label: '每页个数',
      },
    },
    label: '公物仓',
  },
});
