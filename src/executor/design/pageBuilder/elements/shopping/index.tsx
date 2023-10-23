import CustomMenu from '@/components/CustomMenu';
import { loadSpeciesItemMenu } from '@/executor/open/form/config';
import useMenuUpdate from '@/hooks/useMenuUpdate';
import { kernel, schema } from '@/ts/base';
import { Enumerable } from '@/ts/base/common/linq';
import orgCtrl, { Controller } from '@/ts/controller';
import { Form, IForm } from '@/ts/core/thing/standard/form';
import { PlusCircleFilled } from '@ant-design/icons';
import { Button, Col, Empty, Layout, Pagination, Row, Space, Tag } from 'antd';
import Sider from 'antd/lib/layout/Sider';
import { Content, Header } from 'antd/lib/layout/layout';
import React, { ReactNode, useEffect, useState } from 'react';
import { ExistTypeMeta } from '../../core/ElementMeta';
import { Context } from '../../render/PageContext';
import { defineElement } from '../defineElement';
import ShoppingBadge from './design/ShoppingBadge';
import ShoppingList from './design/ShoppingList';
import cls from './index.module.less';
import { useCenter, useStagings } from './useChange';

interface IProps {
  form: IForm;
  work: string | undefined;
  size: number;
  span: number;
  total: number;
  ctx: Context;
  filter: { id: string; valueType: string; rule: string }[];
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
    <Layout>
      <Header>{props.banner}</Header>
      <Layout hasSider>
        <Sider>{props.species}</Sider>
        <Layout>
          <Header>{props.dicts}</Header>
          <Content>{props.entities}</Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

const ViewLeftTree: React.FC<IProps> = (props) => {
  const [key, rootMenu, selectMenu, setSelectMenu] = useMenuUpdate(
    () => loadSpeciesItemMenu(props.form),
    new Controller(props.form.key),
  );
  return (
    <div>
      {selectMenu && rootMenu && (
        <CustomMenu
          key={key}
          item={selectMenu.parentMenu ?? rootMenu}
          collapsed={false}
          selectMenu={selectMenu}
          onSelect={(item) => {
            setSelectMenu(item);
          }}
        />
      )}
    </div>
  );
};

const DesignTopSearch: React.FC<{ form: IForm }> = (props) => {
  return (
    <Space direction={'vertical'}>
      {props.form.fields
        .filter((item) => item.valueType == '选择型')
        .map((dict) => {
          return (
            <Space align="start" key={dict.id} direction="horizontal">
              <Tag color="blue">{dict.name}</Tag>
              <Row gutter={[6, 6]} key={dict.id}>
                {(dict.lookups ?? []).map((up) => {
                  return <Tag key={up.id}>{up.text}</Tag>;
                })}
              </Row>
            </Space>
          );
        })}
    </Space>
  );
};

const ViewTopSearch: React.FC<{ form: IForm }> = (props) => {
  return (
    <Space direction={'vertical'}>
      {props.form.fields
        .filter((item) => item.valueType == '选择型')
        .map((dict) => {
          return (
            <Space align="start" key={dict.id} direction="horizontal">
              <Tag color="blue">{dict.name}</Tag>
              <Row gutter={[6, 6]} key={dict.id}>
                {(dict.lookups ?? []).map((up) => {
                  return <Tag key={up.id}>{up.text}</Tag>;
                })}
              </Row>
            </Space>
          );
        })}
    </Space>
  );
};

const DesignEntities: React.FC<IProps> = (props) => {
  const [page, setPage] = useState<number>(1);
  const [size, setSize] = useState<number>(props.size);
  return (
    <Space direction={'vertical'}>
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
      <Pagination
        current={page}
        pageSize={size}
        total={props.total}
        onChange={(page, size) => {
          setPage(page);
          setSize(size);
        }}
      />
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
    <Space direction="vertical">
      <Row style={{ width: '100%' }} gutter={[16, 16]}>
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
      <div className={cls.shoppingBtn}>
        <ShoppingBadge box={orgCtrl.box} />
      </div>
      <ShoppingList box={orgCtrl.box} fields={props.form.fields} />
      {center}
    </Space>
  );
};

export default defineElement({
  render(props, ctx) {
    console.log(props, ctx);
    const [form, setForm] = useState<IForm>();
    useEffect(() => {
      loadForm(props.form, ctx).then((res) => setForm(res));
    }, []);
    if (form) {
      if (ctx.view.mode == 'design') {
        return (
          <ShoppingLayout
            banner={props.banner({})}
            species={props.leftTree({ species: props.species, form: form })}
            dicts={<DesignTopSearch {...props} form={form} />}
            entities={<DesignEntities ctx={ctx} {...props} form={form} />}
          />
        );
      }
      return (
        <ShoppingLayout
          banner={props.banner ? props.banner({}) : <></>}
          species={<ViewLeftTree ctx={ctx} {...props} form={form} />}
          dicts={<ViewTopSearch form={form} />}
          entities={<ViewEntities ctx={ctx} {...props} form={form} />}
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
        label: '总个数',
        default: 100,
      },
      filter: {
        type: 'array',
        label: '过滤',
        elementType: {
          type: 'object',
          label: '类型',
          properties: {
            id: {
              type: 'string',
              label: '主键',
            },
            valueType: {
              type: 'string',
              label: '类型',
            },
            rule: {
              type: 'string',
              label: '规则',
            },
          },
        },
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
    },
    type: 'Element',
    label: '公物仓',
  },
});
