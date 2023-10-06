import {
  AiOutlineCheck,
  AiOutlinePlusSquare,
  AiOutlineRead,
  AiOutlineShoppingCart,
} from '@/icons/ai';
import { FieldModel } from '@/ts/base/model';
import { IForm } from '@/ts/core';
import { ShareIdSet } from '@/ts/core/public/entity';
import { IPageTemplate } from '@/ts/core/thing/standard/page';
import {
  Badge,
  Button,
  Card,
  Col,
  Image,
  Modal,
  Pagination,
  Row,
  Space,
  Tag,
} from 'antd';
import Meta from 'antd/lib/card/Meta';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { ExistTypeMeta } from '../../core/ElementMeta';
import { defineElement } from '../defineElement';
import cls from './index.module.less';
import Asset from '/img/asset.png';
import { PageContext } from '../../render/PageContext';
import { generateUuid } from '@/ts/base/common';

interface IProps {
  form?: IForm;
  template?: IPageTemplate;
}

const Welfare: React.FC<IProps> = ({ form, template }) => {
  const ctx = useContext(PageContext);
  const [notInit, setNotInit] = useState<boolean>(true);
  const all = useRef<any[]>([]);
  const search = useRef<FieldModel[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1);
  const [size, setSize] = useState<number>(50);
  const [total, setTotal] = useState<number>(0);
  const [choose, setChoose] = useState<any[]>([]);
  const [open, setOpen] = useState<boolean>(false);
  const [item, setItem] = useState<any>();
  useEffect(() => {
    if (notInit && form) {
      form.loadContent().then(() => {
        all.current = [];
        for (let i = 0; i < 10; i++) {
          all.current.push({});
        }
        setData(all.current.splice((page - 1) * size, size));
        setTotal(all.current.length);
        setNotInit(false);
        const select = ['选择型', '分类型'];
        const judge = (item: any) => select.indexOf(item.valueType) != -1;
        search.current = form.fields.filter(judge);
      });
    }
  });
  if (!form) {
    return <></>;
  }
  const Search: React.FC<{ search: FieldModel[] }> = ({ search }) => {
    return (
      <>
        {search.map((item) => {
          return (
            <Space direction="horizontal">
              <Tag color="blue">{item.name}</Tag>
              {item.lookups?.map((up) => {
                return <Tag>{up.text}</Tag>;
              }) ?? <></>}
            </Space>
          );
        })}
      </>
    );
  };
  const Grid: React.FC<{ data: any[]; choose: any[] }> = ({ data, choose }) => {
    return (
      <Row gutter={[8, 8]}>
        {data.map((item) => {
          const actions = [
            <AiOutlineRead
              onClick={() => {
                setItem(item);
                setOpen(true);
              }}
            />,
          ];
          if (choose.findIndex((one) => one.Id == item.Id) == -1) {
            actions.push(
              <AiOutlinePlusSquare
                onClick={() => {
                  setChoose([...choose, item]);
                }}
              />,
            );
          } else {
            actions.push(
              <AiOutlineCheck
                color="red"
                onClick={() => {
                  setChoose(choose.filter((one) => one.Id != item.Id));
                }}
              />,
            );
          }
          const children = template?.metadata.rootElement.children;
          if (children && children.length > 0) {
            const first = children[0];
            const Render = ctx.view.components.getComponentRender(
              first.kind,
              ctx.view.mode,
            );
            return (
              <Col key={generateUuid()} span={4} className={cls.contentCard}>
                <Render element={first} />
              </Col>
            );
          }
          return (
            <Col span={4} className={cls.contentCard}>
              <Card
                hoverable
                cover={<Image width={100} height={100} src={Asset} />}
                actions={actions}>
                <Meta title={'电脑'} description="xxx路xxx号" />
              </Card>
            </Col>
          );
        })}
      </Row>
    );
  };
  const FlowButton: React.FC<{}> = () => {
    return (
      <Badge count={choose.length}>
        <Button
          size="large"
          type="primary"
          shape="circle"
          icon={<AiOutlineShoppingCart />}
        />
      </Badge>
    );
  };
  const Page: React.FC<{}> = () => {
    return (
      <Pagination
        current={page}
        pageSize={size}
        total={total}
        onChange={(page, size) => {
          setPage(page);
          setSize(size);
          setData(all.current.splice((page - 1) * size, size));
        }}
      />
    );
  };
  const Box: React.FC<{}> = () => {
    return (
      <Modal
        title={item?.name}
        open={open}
        onCancel={() => setOpen(false)}
        destroyOnClose={true}
        cancelText={'关闭'}
        width={1000}>
        <div className={cls.box}>
          <Card hoverable cover={<Image width={100} height={100} src={Asset} />}>
            <Meta title={'电脑'} description="xxx路xxx号" />
          </Card>
        </div>
      </Modal>
    );
  };
  return (
    <div className={cls.layout}>
      <div className={cls.search}>
        <Search search={search.current} />
      </div>
      <div className={cls.contentData}>
        <div className={cls.contentGrid}>
          <Grid data={data} choose={choose} />
        </div>
      </div>
      <div className={cls.contentPage}>
        <Page />
      </div>
      <div className={cls.shoppingBtn}>
        <FlowButton />
      </div>
      <Box />
    </div>
  );
};

export default defineElement({
  render(props) {
    console.log(props);
    const form = ShareIdSet.get(props.formId + '*') as IForm;
    const page = ShareIdSet.get(props.pageId + '*') as IPageTemplate;
    return <Welfare form={form} template={page} />;
  },
  displayName: 'Welfare',
  meta: {
    props: {
      formId: {
        type: 'type',
        label: '关联表单',
        typeName: 'form',
      } as ExistTypeMeta<string>,
      pageId: {
        type: 'type',
        label: '展示卡片',
        typeName: 'page',
      } as ExistTypeMeta<string>,
    },
    label: '公物仓',
  },
});
