import OpenFileDialog from '@/components/OpenFileDialog';
import { DeleteOutlined } from '@ant-design/icons';
import { Button, Row, Space, Tag } from 'antd';
import React, { ReactNode, useState } from 'react';
import { ExistTypeMeta } from '../../core/ElementMeta';
import { Context } from '../../render/PageContext';
import { defineElement } from '../defineElement';

export interface Form {
  id: string;
  name: string;
}

interface IProps {
  ctx: Context;
  forms: Form[];
}

const Layout: React.FC<{ children: ReactNode }> = (props) => {
  return <div style={{ padding: 10 }}>{props.children}</div>;
};

const Design: React.FC<IProps> = (props) => {
  const [forms, setForms] = useState(props.forms);
  const [center, setCenter] = useState(<></>);
  return (
    <Layout>
      <Space direction="vertical">
        <Space align="start">
          <DeleteOutlined
            onClick={() => {
              props.forms.splice(0, props.forms.length);
              setForms([...props.forms]);
            }}
          />
          <Tag color="blue">表单过滤</Tag>
          <Row gutter={[8, 8]}>
            {forms.map((item, index) => {
              return (
                <Space key={index} align="start">
                  <DeleteOutlined
                    onClick={() => {
                      props.forms.splice(index, 1);
                      setForms([...props.forms]);
                    }}
                  />
                  <Tag>{item.name}</Tag>
                </Space>
              );
            })}
          </Row>
        </Space>
        <Space>
          <Button
            type="dashed"
            size="small"
            onClick={() => {
              setCenter(
                <OpenFileDialog
                  accepts={['表单']}
                  rootKey={props.ctx.view.pageInfo.directory.spaceKey}
                  excludeIds={props.forms.map((item) => item.id)}
                  multiple={true}
                  onOk={async (files) => {
                    if (files.length > 0) {
                      for (const file of files) {
                        props.forms.push({
                          id: file.id,
                          name: file.name,
                        });
                      }
                      setForms([...props.forms]);
                    }
                    setCenter(<></>);
                    return;
                  }}
                  onCancel={() => setCenter(<></>)}
                />,
              );
            }}>
            添加表单
          </Button>
        </Space>
      </Space>
      {center}
    </Layout>
  );
};

export default defineElement({
  render(props, ctx) {
    if (ctx.view.mode == 'design') {
      return <Design {...props} ctx={ctx} />;
    }
  },
  displayName: 'FormSearch',
  meta: {
    type: 'Element',
    label: '表单搜索',
    props: {
      forms: {
        type: 'array',
        label: '过滤',
        elementType: {
          type: 'type',
          label: '表单',
        } as ExistTypeMeta<Form>,
        default: [],
      },
    },
  },
});
