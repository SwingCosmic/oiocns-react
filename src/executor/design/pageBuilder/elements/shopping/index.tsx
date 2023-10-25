import { kernel, schema } from '@/ts/base';
import { Enumerable } from '@/ts/base/common/linq';
import orgCtrl from '@/ts/controller';
import { Form, IForm } from '@/ts/core/thing/standard/form';
import { PlusCircleFilled } from '@ant-design/icons';
import { Button, Col, Empty, Pagination, Row, Space } from 'antd';
import React, { ReactNode, useEffect, useState } from 'react';
import { ExistTypeMeta } from '../../core/ElementMeta';
import { Context } from '../../render/PageContext';
import { defineElement } from '../defineElement';
import ShoppingBadge from './design/ShoppingBadge';
import ShoppingList from './design/ShoppingList';
import cls from './index.module.less';
import { useCenter, useStagings } from './useChange';

export interface Filter {
  id: string;
  valueType: string;
  rule: Range[];
}

export interface Range {
  id: number;
  start: number;
  end: number;
}

interface IProps {
  form: IForm;
  work: string | undefined;
  size: number;
  span: number;
  total: number;
  ctx: Context;
  filter: Filter[];
  species: string[];
  content?: (params: { card: schema.XThing }) => ReactNode | ReactNode[];
}

const loadForm = async (form: string | undefined, ctx: Context) => {
  if (form) {
    const directory = ctx.view.pageInfo.directory;
    const metadata = await directory.resource.formColl.find([form]);
    if (metadata.length > 0) {
      const form = new Form(metadata[0], directory);
      await form.loadContent();
      return form;
    }
  }
};

interface ILayout {
  banner?: ReactNode;
  species?: ReactNode;
  dicts?: ReactNode;
  entities: ReactNode;
}

const ShoppingLayout: React.FC<ILayout> = (props) => {
  return (
    <div className={cls.layout}>
      <div className={cls.banner}>{props.banner}</div>
      <div className={cls.body}>
        <div className={cls.species}>{props.species}</div>
        <div className={cls.content}>
          <div className={cls.dicts}>{props.dicts}</div>
          <div className={cls.entities}>{props.entities}</div>
        </div>
      </div>
    </div>
  );
};

const DesignEntities: React.FC<IProps> = (props) => {
  const [page, setPage] = useState<number>(1);
  const [size, setSize] = useState<number>(props.size);
  return (
    <Space style={{ width: '100%' }} direction={'vertical'} align="center">
      <Row style={{ width: '100%' }} gutter={[16, 16]}>
        {Enumerable.Range(1, 10)
          .ToArray()
          .map((_, index) => {
            if (props.content) {
              return (
                <Col key={index} span={props.span} className={cls.contentCard}>
                  <Space.Compact direction="vertical">
                    {props.content({ card: {} as schema.XThing })}
                  </Space.Compact>
                </Col>
              );
            }
            return <Empty key={index} description={'未放置组件'} />;
          })}
      </Row>
      <div className={cls.page}>
        <Pagination
          current={page}
          pageSize={size}
          total={props.total}
          onChange={(page, size) => {
            setPage(page);
            setSize(size);
          }}
        />
      </div>
    </Space>
  );
};

const ViewEntities: React.FC<IProps> = (props) => {
  const [page, setPage] = useState<number>(1);
  const [size, setSize] = useState<number>(props.size);
  const [total, setTotal] = useState<number>(0);
  const [data, setData] = useState<any[]>([]);
  const stagings = useStagings(orgCtrl.box);
  const center = useCenter();
  useEffect(() => {
    loadData(size, page, props.form);
  }, []);
  const loadData = async (take: number, page: number, form?: IForm) => {
    if (!form) return;
    const res = await kernel.loadThing(
      form.belongId,
      [form.directory.target.spaceId, form.directory.target.id],
      {
        take: take,
        skip: (page - 1) * take,
        requireTotalCount: true,
      },
    );
    setData(res.data ?? []);
    setSize(take);
    setPage(page);
    setTotal(res.totalCount);
  };
  return (
    <Space style={{ width: '100%' }} direction="vertical">
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
      <div className={cls.page}>
        <Pagination
          current={page}
          pageSize={size}
          total={total}
          onChange={(page, size) => {
            if (props.form) {
              loadData(size, page, props.form);
            }
          }}
        />
      </div>
      <ShoppingBadge box={orgCtrl.box} />
      <ShoppingList box={orgCtrl.box} fields={props.form.fields} />
      {center}
    </Space>
  );
};

export default defineElement({
  render(props, ctx) {
    const [form, setForm] = useState<IForm>();
    useEffect(() => {
      loadForm(props.form, ctx).then((res) => setForm(res));
    }, []);
    if (form) {
      return (
        <ShoppingLayout
          banner={props.banner({})}
          species={props.leftTree({ species: props.species, form: form })}
          dicts={props.topDicts({ filter: props.filter, form: form })}
          entities={
            ctx.view.mode == 'design' ? (
              <DesignEntities ctx={ctx} {...props} form={form} />
            ) : (
              <ViewEntities ctx={ctx} {...props} form={form} />
            )
          }
        />
      );
    }
    return <Empty description={'请先绑定一个表单'} />;
  },
  displayName: 'Welfare',
  meta: {
    props: {
      form: {
        type: 'type',
        label: '展示表单',
        typeName: 'formFile',
      } as ExistTypeMeta<string | undefined>,
      work: {
        type: 'type',
        label: '绑定办事',
        typeName: 'workFile',
      } as ExistTypeMeta<string | undefined>,
      size: {
        type: 'number',
        label: '每页个数',
        default: 12,
      },
      span: {
        type: 'number',
        label: '行卡片占比',
        default: 4,
      },
      total: {
        type: 'number',
        label: '默认总个数',
        default: 40,
      },
      filter: {
        type: 'array',
        label: '过滤',
        elementType: {
          type: 'type',
          label: '过滤',
          typeName: 'Filter',
        } as ExistTypeMeta<Filter>,
        default: [],
      },
      species: {
        type: 'array',
        label: '分类数组',
        elementType: {
          type: 'string',
          label: '分类',
        },
        default: [],
      },
    },
    slots: {
      banner: {
        label: '横幅插槽',
        single: true,
        params: {},
        default: 'HeadBanner',
      },
      content: {
        label: '实体列表插槽',
        single: true,
        params: {
          card: {
            label: '列表数据',
            type: {
              type: 'type',
              label: '卡片模板',
              typeName: 'slot',
            } as ExistTypeMeta<schema.XThing | undefined>,
          },
        },
        default: 'MetaCard',
      },
      leftTree: {
        label: '左侧树插槽',
        single: true,
        params: {
          species: {
            label: '已选分类数组',
            type: {
              type: 'array',
              elementType: {
                type: 'string',
                label: '分类',
              },
            },
          },
          form: {
            label: '表单',
            type: {
              type: 'type',
              typeName: 'form',
            } as ExistTypeMeta<IForm>,
          },
        },
        default: 'SpeciesTree',
      },
      topDicts: {
        label: '顶部字典',
        single: true,
        params: {
          filter: {
            label: '已选字典数组',
            type: {
              type: 'array',
              elementType: {
                type: 'type',
                label: '过滤',
                typeName: 'Filter',
              } as ExistTypeMeta<Filter>,
            },
          },
          form: {
            label: '表单',
            type: {
              type: 'type',
              typeName: 'form',
            } as ExistTypeMeta<IForm>,
          },
        },
        default: 'DictSearch',
      },
    },
    type: 'Element',
    label: '商城',
  },
});
