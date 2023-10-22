import { kernel, model, schema } from '@/ts/base';
import orgCtrl from '@/ts/controller';
import { Form } from '@/ts/core/thing/standard/form';
import { Button, Col, Empty, Pagination, Row, Space, Tag } from 'antd';
import React, { useEffect, useState } from 'react';
import { ExistTypeMeta } from '../../core/ElementMeta';
import { defineElement } from '../defineElement';
import cls from './index.module.less';
import ShoppingBadge from './widgets/ShoppingBadge';
import ShoppingList from './widgets/ShoppingList';
import { PlusCircleFilled } from '@ant-design/icons';
import { useStagings } from './useChange';

export default defineElement({
  render(props, ctx) {
    const dir = ctx.view.pageInfo.directory;
    const form = props.form ? new Form(props.form, dir) : undefined;
    const [data, setData] = useState<any[]>([]);
    const [page, setPage] = useState<number>(1);
    const [size, setSize] = useState<number>(props.pageSize ?? 20);
    const [total, setTotal] = useState<number>(0);
    const [fields, setFields] = useState<model.FieldModel[]>([]);
    const stagings = useStagings(orgCtrl.box);
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
                <Space align="start" key={item.id} direction="horizontal">
                  <Tag color="blue">{item.name}</Tag>
                  <Row gutter={[6, 6]} key={item.id}>
                    {(item.lookups ?? []).map((up) => {
                      return <Tag key={up.id}>{up.text}</Tag>;
                    })}
                  </Row>
                </Space>
              );
            })}
        </div>
        <div className={cls.contentData}>
          <div className={cls.contentGrid}>
            <Row gutter={[16, 16]}>
              {data.map((item) => {
                if (props.content) {
                  const has = stagings.filter((staging) => staging.dataId == item.id);
                  return (
                    <Col key={item.id} span={props.span} className={cls.contentCard}>
                      <Space.Compact direction="vertical">
                        {props.content({ card: item })}
                        {has.length == 0 && (
                          <Button
                            icon={<PlusCircleFilled style={{ color: 'green' }} />}
                            size="small"
                            onClick={() => {
                              if (props.form?.belongId) {
                                orgCtrl.box.createStaging({
                                  typeName: '实体',
                                  dataId: item.id,
                                  data: item,
                                  relations: [item.belongId],
                                } as schema.XStaging);
                              }
                            }}>
                            {'加入购物车'}
                          </Button>
                        )}
                        {has.length > 0 && (
                          <Button
                            icon={<PlusCircleFilled style={{ color: 'red' }} />}
                            size="small"
                            onClick={() => {
                              orgCtrl.box.removeStaging(has);
                            }}>
                            {'取消加入'}
                          </Button>
                        )}
                      </Space.Compact>
                    </Col>
                  );
                }
                return <Empty key={item.id} description={'未放置组件'} />;
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
          <ShoppingBadge box={orgCtrl.box} />
        </div>
        <ShoppingList box={orgCtrl.box} forms={form ? [form] : []} />
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
      span: {
        type: 'number',
        label: '行卡片占比',
        default: 4,
      },
    },
    slots: {
      content: {
        label: '子元素内容插槽',
        single: true,
        params: {
          card: {
            label: '列表数据',
            type: {
              type: 'type',
              label: '卡片模板',
              typeName: 'slot',
            } as ExistTypeMeta<schema.XThing>,
          },
        },
      },
    },
    type: 'Element',
    label: '公物仓',
  },
});
