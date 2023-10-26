import OpenFileDialog from '@/components/OpenFileDialog';
import { DeleteOutlined } from '@ant-design/icons';
import { Button, Row, Space, Tag } from 'antd';
import React, { useState } from 'react';
import { ExistTypeMeta } from '../../core/ElementMeta';
import { Context } from '../../render/PageContext';
import { defineElement } from '../defineElement';

interface Form {
  id: string;
  name: string;
}

interface IProps {
  ctx: Context;
  forms: Form[];
}

const Design: React.FC<IProps> = (props) => {
  const [forms, setForms] = useState(props.forms);
  const [center, setCenter] = useState(<></>);
  return (
    <div style={{ paddingTop: 10, paddingBottom: 10 }}>
      <Space direction="vertical">
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
                          id: 'F' + file.id,
                          name: file.name,
                        });
                      }
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
    </div>
  );
};

const View: React.FC<IProps> = (props) => {
  return (
    <div style={{ padding: 10 }}>
      <Space direction="vertical">
        {props.forms.map((item, index) => {
          return <Tag key={index}>{item.name}</Tag>;
        })}
      </Space>
    </div>
  );
};

export default defineElement({
  render(props, ctx) {
    if (ctx.view.mode == 'design') {
      return <Design {...props} ctx={ctx} />;
    }
    return <View {...props} ctx={ctx} />;
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
