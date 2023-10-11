import { AiOutlineShoppingCart } from '@/icons/ai';
import { kernel, model, schema } from '@/ts/base';
import { Form } from '@/ts/core/thing/standard/form';
import { Badge, Button, Col, Pagination, Row, Space, Tag } from 'antd';
import React, { useEffect, useState } from 'react';
import { ExistTypeMeta } from '../../core/ElementMeta';
import { defineElement } from '../defineElement';
import cls from './index.module.less';

export default defineElement({
  render(props, ctx) {
    const dir = ctx.view.pageInfo.directory;
    const form = props.form ? new Form(props.form, dir) : undefined;
    const [data, setData] = useState<any[]>([]);
    const [page, setPage] = useState<number>(1);
    const [size, setSize] = useState<number>(props.pageSize ?? 20);
    const [total, setTotal] = useState<number>(0);
    const [fields, setFields] = useState<model.FieldModel[]>([]);
    useEffect(() => {
      const init = async () => {
        await form?.loadContent();
        setFields(form?.fields ?? []);
        await loadData(size, page);
      };
      init();
    }, []);
    const loadData = async (take: number, page: number) => {
      if (!form) return;
      const res = await kernel.loadThing(form.belongId, [form.belongId], {
        take: take,
        skip: (page - 1) * take,
        requireTotalCount: true,
      });
      setData(res.data ?? []);
      setSize(take);
      setPage(page);
      setTotal(res.totalCount);
    };
    return (
      <div className={cls.layout}>
        <div className={cls.search}>
          {fields
            .filter((item: any) => ['选择型', '分类型'].includes(item.valueType))
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
          <Badge count={0}>
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
      form: {
        type: 'type',
        label: '关联表单',
        typeName: 'formFile',
      } as ExistTypeMeta<schema.XForm | undefined>,
      pageSize: {
        type: 'number',
        label: '每页个数',
      },
    },
    label: '公物仓',
  },
});
