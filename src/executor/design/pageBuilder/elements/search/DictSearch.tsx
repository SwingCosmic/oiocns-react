import { FieldModel, FiledLookup } from '@/ts/base/model';
import { IForm } from '@/ts/core';
import { EditableProTable, ProFormInstance } from '@ant-design/pro-components';
import { Button, Modal, Row, Space, Table, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import { ExistTypeMeta } from '../../core/ElementMeta';
import { Context } from '../../render/PageContext';
import { defineElement } from '../defineElement';
import { Filter, Range } from '../shopping';

interface IProps {
  ctx: Context;
  filter: Filter[];
  form: IForm;
}

const Design: React.FC<IProps> = (props) => {
  const [dictOpen, setDictOpen] = useState(false);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [current, setCurrent] = useState<Filter>();
  const [defineOpen, setDefineOpen] = useState(false);
  return (
    <div style={{ paddingTop: 10, paddingBottom: 10 }}>
      <Space direction="vertical">
        <View {...props} />
        <Space>
          <Button type="dashed" onClick={() => setDictOpen(true)}>
            添加字典条件
          </Button>
          <Button type="dashed" onClick={() => setRangeOpen(true)}>
            添加数值条件
          </Button>
        </Space>
      </Space>
      <DictModal
        open={dictOpen}
        fields={props.form.fields}
        selected={props.filter}
        onOk={(selected) => {
          if (selected.length > 0) {
            props.filter.push(...selected);
          }
          setDictOpen(false);
        }}
      />
      <RangeModal
        open={rangeOpen}
        fields={props.form.fields}
        selected={props.filter}
        onOk={(info) => {
          setCurrent(info);
          setRangeOpen(false);
          setDefineOpen(true);
        }}
        onCancel={() => setRangeOpen(false)}
      />
      {current && (
        <DefineModal
          open={defineOpen}
          current={current}
          onOk={(ranges) => {
            current.rule = [...ranges];
            setDefineOpen(false);
          }}
          onCancel={() => setDefineOpen(false)}
        />
      )}
    </div>
  );
};

interface ModalProps {
  open: boolean;
  fields: FieldModel[];
  selected: Filter[];
}

interface DictProps extends ModalProps {
  onOk: (fields: Filter[]) => void;
}

const DictModal: React.FC<DictProps> = (props) => {
  const [current, setCurrent] = useState<FieldModel[]>([]);
  return (
    <Modal
      open={props.open}
      destroyOnClose
      onOk={() =>
        props.onOk(
          current.map((item) => {
            return {
              id: item.id,
              valueType: item.valueType,
              rule: [],
            };
          }),
        )
      }
      onCancel={() => props.onOk([])}
      cancelButtonProps={{ hidden: true }}
      width={'50vw'}>
      <Table
        rowKey={'id'}
        scroll={{ x: 400, y: 400 }}
        dataSource={props.fields
          .filter((item) => '选择型' == item.valueType)
          .filter((item) => !props.selected.map((item) => item.id).includes(item.id))}
        rowSelection={{
          type: 'checkbox',
          selectedRowKeys: current.map((item) => item.id),
          onChange: (_, selectedRows) => {
            setCurrent(selectedRows);
          },
        }}
        columns={[
          {
            title: '分类名称',
            dataIndex: 'name',
          },
          {
            title: '分类编码',
            dataIndex: 'code',
          },
        ]}
      />
    </Modal>
  );
};

interface RangeProps extends ModalProps {
  onOk: (field: Filter) => void;
  onCancel: () => void;
}

const RangeModal: React.FC<RangeProps> = (props) => {
  return (
    <Modal
      open={props.open}
      destroyOnClose
      onOk={() => props.onCancel()}
      onCancel={() => props.onCancel()}
      cancelButtonProps={{ hidden: true }}
      width={'50vw'}>
      <Table
        scroll={{ x: 400, y: 400 }}
        dataSource={props.fields
          .filter((item) => '数值型' == item.valueType)
          .filter((item) => !props.selected.map((item) => item.id).includes(item.id))}
        rowSelection={{
          type: 'radio',
          onSelect: (info) => {
            props.onOk({
              id: info.id,
              valueType: info.valueType,
              rule: [],
            });
          },
        }}
        rowKey={'id'}
        columns={[
          {
            title: '数值名称',
            dataIndex: 'name',
          },
          {
            title: '数值编码',
            dataIndex: 'code',
          },
          {
            title: '计量单位',
            dataIndex: 'unit',
          },
        ]}
      />
    </Modal>
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
          value={props.current.rule}
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
              return { id: index, start: 0, end: 0 };
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
  fields: FieldModel[];
  item: Filter;
}

const Center: React.FC<CenterProps> = (props) => {
  const item = props.item;
  const field = props.fields.find((field) => field.id == props.item.id);
  switch (props.item.valueType) {
    case '选择型':
      return (
        <Template<FiledLookup>
          name={field?.name ?? ''}
          items={field?.lookups ?? []}
          tag={(item) => item.text}
        />
      );
    case '数值型':
      return (
        <Template<Range>
          name={field?.name ?? ''}
          items={item.rule}
          tag={(item) => {
            let start = `${item.start ?? ''}${field?.unit ?? ''}`;
            let end = `${item.end ?? ''}${field?.unit ?? ''}`;
            return start + '~' + end;
          }}
        />
      );
  }
  return <></>;
};

const View: React.FC<IProps> = (props) => {
  return (
    <Space direction="vertical">
      {props.filter.map((item, index) => {
        return <Center key={index} fields={props.form.fields} item={item} />;
      })}
    </Space>
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
      form: {
        type: 'type',
        typeName: 'form',
        hidden: true,
      } as ExistTypeMeta<IForm>,
    },
  },
});
