import OpenFileDialog from '@/components/OpenFileDialog';
import { schema } from '@/ts/base';
import { IFile, IProperty, ISpecies } from '@/ts/core';
import { DeleteOutlined } from '@ant-design/icons';
import { EditableProTable, ProFormInstance } from '@ant-design/pro-components';
import { Button, Modal, Row, Space, Spin, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import { ExistTypeMeta } from '../../core/ElementMeta';
import { useSpecies } from '../../core/hooks/useSpecies';
import { Context } from '../../render/PageContext';
import { defineElement } from '../defineElement';
import { Filter, Range } from '../shopping';

interface IProps {
  ctx: Context;
  filter: Filter[];
}

const loadDicts = (filter: Filter[]) => {
  return filter.filter((item) => item.valueType == '选择型').map((item) => item.id);
};

const Design: React.FC<IProps> = (props) => {
  const { loading, species, setSpecies } = useSpecies(loadDicts(props.filter), props.ctx);
  const [current, setCurrent] = useState<Filter>();
  const [defineOpen, setDefineOpen] = useState(false);
  const [filter, setFilter] = useState(props.filter);
  const [center, setCenter] = useState(<></>);
  const setOpenFile = (
    accepts: string[],
    onOk: (files: IFile[]) => void,
    multiple: boolean = true,
  ) => {
    setCenter(
      <OpenFileDialog
        accepts={accepts}
        rootKey={props.ctx.view.pageInfo.directory.spaceKey}
        excludeIds={props.filter.map((item) => item.id)}
        multiple={multiple}
        onOk={async (files) => {
          if (files.length > 0) {
            onOk(files);
          }
          setCenter(<></>);
          return;
        }}
        onCancel={() => setCenter(<></>)}
      />,
    );
  };
  return (
    <Spin spinning={loading}>
      <div style={{ paddingTop: 10, paddingBottom: 10 }}>
        <Space direction="vertical">
          <Space>
            <Button
              type="dashed"
              onClick={() => {
                setOpenFile(['字典'], (files) => {
                  for (const file of files) {
                    props.ctx.view.pageInfo.species.push(file as ISpecies);
                    props.filter.push({
                      id: file.id,
                      name: file.name,
                      valueType: '选择型',
                      rule: [],
                    });
                  }
                  setSpecies(loadDicts(props.filter), props.ctx);
                  setFilter([...props.filter]);
                });
              }}>
              添加字典条件
            </Button>
            <Button
              type="dashed"
              onClick={() => {
                setOpenFile(
                  ['数值型'],
                  (files) => {
                    let current = {
                      id: files[0].id,
                      name: files[0].name,
                      valueType: (files[0] as IProperty).metadata.valueType,
                      rule: [],
                    };
                    props.filter.push(current);
                    setFilter([...props.filter]);
                    setCurrent(current);
                  },
                  false,
                );
              }}>
              添加数值条件
            </Button>
          </Space>
          <Space direction="vertical">
            {filter.map((item, index) => {
              return (
                <Space key={index} align="start">
                  <DeleteOutlined
                    onClick={() => {
                      props.filter.splice(index, 1);
                      setFilter([...props.filter]);
                    }}
                  />
                  <Center
                    speciesItems={species.find((one) => one.id == item.id)?.items ?? []}
                    item={item}
                  />
                </Space>
              );
            })}
          </Space>
        </Space>
        {center}
        {current && (
          <DefineModal
            open={defineOpen}
            current={current}
            onOk={(ranges) => {
              current.rule = [...ranges];
              props.filter.push(current);
              setFilter([...props.filter]);
              setDefineOpen(false);
              setCurrent(undefined);
            }}
            onCancel={() => {
              setDefineOpen(false);
              setCurrent(undefined);
            }}
          />
        )}
      </div>
    </Spin>
  );
};

interface DefineProps {
  open: boolean;
  current: Filter;
  onOk: (ranges: readonly Range[]) => void;
  onCancel: () => void;
}

const DefineModal: React.FC<DefineProps> = (props) => {
  const [ranges, setRanges] = useState<readonly Range[]>([...props.current.rule]);
  const formRef = useRef<ProFormInstance>();
  return (
    <Modal
      open={props.current && props.open}
      onCancel={() => props.onCancel()}
      onOk={() => props.onOk(ranges)}
      width={'50vw'}
      cancelButtonProps={{ hidden: true }}>
      <div style={{ margin: 10 }}>
        <EditableProTable
          value={ranges}
          controlled
          rowKey={'id'}
          formRef={formRef}
          onChange={(value) => setRanges(value)}
          scroll={{ x: 400, y: 400 }}
          columns={[
            {
              title: '起始',
              dataIndex: 'start',
            },
            {
              title: '中止',
              dataIndex: 'end',
            },
            {
              title: '操作',
              valueType: 'option',
              render: (__, record, _, action) => [
                <a key="editable" onClick={() => action?.startEditable?.(record.id)}>
                  编辑
                </a>,
                <a
                  key="delete"
                  onClick={() => {
                    setRanges(ranges.filter((item) => item.id !== record.id));
                  }}>
                  删除
                </a>,
              ],
            },
          ]}
          editable={{
            type: 'multiple',
          }}
          recordCreatorProps={{
            creatorButtonText: '新增',
            position: 'bottom',
            newRecordType: 'dataSource',
            record: (index) => {
              return { id: index, start: 0, end: 0, unit: '' };
            },
          }}
        />
      </div>
    </Modal>
  );
};

interface ItemProps<T = any> {
  name: string;
  items: T[];
  tag: (item: T) => string;
}

function Template<T>(props: ItemProps<T>) {
  return (
    <Space align="start" direction="horizontal">
      <Tag color="blue">{props.name}</Tag>
      <Row gutter={[6, 6]}>
        {props.items.map((up, index) => {
          return <Tag key={index}>{props.tag(up)}</Tag>;
        })}
      </Row>
    </Space>
  );
}

interface CenterProps {
  item: Filter;
  speciesItems: schema.XSpeciesItem[];
}

const Center: React.FC<CenterProps> = (props) => {
  switch (props.item.valueType) {
    case '选择型':
      return (
        <Template<schema.XSpeciesItem>
          name={props.item.name}
          items={props.speciesItems}
          tag={(item) => item.name}
        />
      );
    case '数值型':
      return (
        <Template<Range>
          name={props.item.name}
          items={props.item.rule}
          tag={(item) => {
            let start = `${item.start ?? ''}${item.unit ?? ''}`;
            let end = `${item.end ?? ''}${item.unit ?? ''}`;
            return start + '~' + end;
          }}
        />
      );
  }
  return <></>;
};

const View: React.FC<IProps> = (props) => {
  const { loading, species } = useSpecies(loadDicts(props.filter), props.ctx);
  return (
    <Spin spinning={loading}>
      <div style={{ paddingTop: 10, paddingBottom: 10 }}>
        <Space direction="vertical">
          {props.filter.map((item, index) => {
            return (
              <Center
                speciesItems={species.find((one) => one.id == item.id)?.items ?? []}
                key={index}
                item={item}
              />
            );
          })}
        </Space>
      </div>
    </Spin>
  );
};

export default defineElement({
  render(props, ctx) {
    if (ctx.view.mode == 'design') {
      return <Design {...props} ctx={ctx} />;
    }
    return <View {...props} ctx={ctx} />;
  },
  displayName: 'DictSearch',
  meta: {
    type: 'Element',
    label: '字典搜索',
    props: {
      filter: {
        type: 'array',
        label: '过滤',
        elementType: {
          type: 'type',
          label: '类型',
          typeName: 'Filter',
        } as ExistTypeMeta<Filter>,
        default: [],
      },
    },
  },
});
