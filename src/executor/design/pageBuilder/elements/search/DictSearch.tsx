import OpenFileDialog from '@/components/OpenFileDialog';
import { schema } from '@/ts/base';
import { IFile, IProperty } from '@/ts/core';
import { DeleteOutlined } from '@ant-design/icons';
import { EditableProTable, ProFormInstance } from '@ant-design/pro-components';
import { Button, Modal, Row, Space, Spin, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import { ExistTypeMeta } from '../../core/ElementMeta';
import { SpeciesProp, useSpecies } from '../../core/hooks/useSpecies';
import { Context } from '../../render/PageContext';
import { defineElement } from '../defineElement';
import { Filter, Range } from '../shopping';

interface IProps {
  ctx: Context;
  filter: Filter[];
}

const loadDicts = (filter: Filter[]): SpeciesProp[] => {
  return filter
    .filter((item) => item.valueType == '选择型')
    .map((item) => {
      return {
        id: item.id,
        name: item.name,
        speciesId: item.speciesId,
      };
    });
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
                    ctx={props.ctx}
                    speciesItems={
                      species.find((one) => one.id == item.id)?.species.items ?? []
                    }
                    item={item}
                  />
                </Space>
              );
            })}
          </Space>
          <Space>
            <Button
              type="dashed"
              size="small"
              onClick={() => {
                setOpenFile(['选择型'], (files) => {
                  for (const file of files) {
                    props.filter.push({
                      id: file.id,
                      name: file.name,
                      valueType: '选择型',
                      speciesId: (file as IProperty).metadata.speciesId,
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
              size="small"
              onClick={() => {
                setOpenFile(
                  ['数值型'],
                  (files) => {
                    let current = {
                      id: files[0].id,
                      name: files[0].name,
                      valueType: '数值型',
                      speciesId: '',
                      rule: [],
                    };
                    setFilter([...props.filter]);
                    setCurrent(current);
                    setDefineOpen(true);
                  },
                  false,
                );
              }}>
              添加数值条件
            </Button>
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
              title: '结束',
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
  ctx: Context;
  item: Filter;
  items: T[];
  tag: (item: T) => string;
}

function Template<T>(props: ItemProps<T>) {
  const [selected, setSelected] = useState<number>();
  return (
    <Space align="start" direction="horizontal">
      <Tag color="blue">{props.item.name}</Tag>
      <Row gutter={[6, 6]}>
        {props.items.map((up, index) => {
          const border = selected == index ? '1px dashed green' : '';
          return (
            <Tag
              style={{ border: border }}
              key={index}
              onClick={() => {
                if (index == selected) {
                  setSelected(undefined);
                  switch (props.item.valueType) {
                    case '选择型':
                      props.ctx.view.emitter('dicts', 'delete', props.item.id);
                      break;
                    case '数值型':
                      props.ctx.view.emitter('ranges', 'delete', props.item.id);
                      break;
                  }
                  return;
                }
                setSelected(index);
                switch (props.item.valueType) {
                  case '选择型':
                    {
                      const item = up as schema.XSpeciesItem;
                      const args = [`T${props.item.id}`, '=', item.code || `S${item.id}`];
                      props.ctx.view.emitter('dicts', 'changed', {
                        id: props.item.id,
                        data: args,
                      });
                    }
                    break;
                  case '数值型':
                    {
                      const item = up as Range;
                      const args = [];
                      if (item.start || item.start === 0) {
                        args.push([`T${props.item.id}`, '>=', Number(item.start)]);
                      }
                      if (item.end || item.end === 0) {
                        args.push([`T${props.item.id}`, '<=', Number(item.end)]);
                      }
                      if (args.length > 0) {
                        props.ctx.view.emitter('ranges', 'changed', {
                          id: props.item.id,
                          data: args,
                        });
                      }
                    }
                    break;
                }
              }}>
              {props.tag(up)}
            </Tag>
          );
        })}
      </Row>
    </Space>
  );
}

interface CenterProps {
  ctx: Context;
  item: Filter;
  speciesItems: schema.XSpeciesItem[];
}

const Center: React.FC<CenterProps> = (props) => {
  switch (props.item.valueType) {
    case '选择型':
      return (
        <Template<schema.XSpeciesItem>
          ctx={props.ctx}
          item={props.item}
          items={props.speciesItems}
          tag={(item) => item.name}
        />
      );
    case '数值型':
      return (
        <Template<Range>
          ctx={props.ctx}
          item={props.item}
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
                ctx={props.ctx}
                speciesItems={
                  species.find((one) => one.id == item.id)?.species.items ?? []
                }
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
