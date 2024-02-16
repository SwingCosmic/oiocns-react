import FullScreenModal from '@/components/Common/fullScreen';
import WorkFormViewer from '@/components/DataStandard/WorkForm/Viewer';
import OpenFileDialog from '@/components/OpenFileDialog';
import { model, schema } from '@/ts/base';
import { Node, Tree } from '@/ts/base/common';
import { IForm } from '@/ts/core';
import { IQuery } from '@/ts/core/work/financial/query';
import { SumItem } from '@/ts/core/work/financial/summary';
import { formatNumber } from '@/utils';
import { ProTable } from '@ant-design/pro-components';
import { Modal, Space, Tag } from 'antd';
import React, { useEffect, useState } from 'react';

interface Props {
  query: IQuery;
  between: [string, string];
  tree: Tree<SumItem>;
  node: Node<SumItem>;
  field: model.FieldModel;
  symbol: number;
  finished: () => void;
}

export function LedgerModal(props: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<model.LoadResult<schema.XChange[]>>();
  const [form, setForm] = useState(props.query.financial.form);
  const [size, setSize] = useState(10);
  const [center, setCenter] = useState(<></>);

  async function loadData(page: number, pageSize: number) {
    setLoading(true);
    setData(
      await props.query.financial.loadChanges({
        species: props.query.species.id,
        between: props.between,
        node: props.node,
        field: props.field,
        symbol: props.symbol,
        offset: (page - 1) * pageSize,
        limit: pageSize,
      }),
    );
    const current = await props.query.financial.loadForm();
    await current?.loadFields();
    setForm(current);
    setLoading(false);
  }

  const setFormFile = async () => {
    setCenter(
      <OpenFileDialog
        accepts={['表单']}
        rootKey={props.query.space.directory.key}
        onOk={async (files) => {
          if (files && files.length > 0) {
            const file = files[0] as IForm;
            await props.query.financial.setForm(file.metadata);
          }
          setCenter(<></>);
        }}
        onCancel={() => setCenter(<></>)}
      />,
    );
  };

  useEffect(() => {
    const id = props.query.financial.subscribe(() => {
      loadData(1, size);
    });
    return () => {
      props.query.financial.unsubscribe(id);
    };
  }, []);
  return (
    <>
      <Modal
        open
        title={
          props.node.data.name +
          '-' +
          props.field.name +
          '-' +
          (props.symbol > 0 ? '增加' : '减少')
        }
        destroyOnClose={true}
        width={1200}
        onCancel={() => props.finished()}>
        <div style={{ width: '100%', textAlign: 'right' }}>
          <Space align="end">
            {form && <Tag color="green">{form.name}</Tag>}
            <a onClick={async () => setFormFile()}>绑定物预览表单</a>
          </Space>
        </div>
        <ProTable<schema.XChange>
          rowKey={'id'}
          style={{ marginTop: 8 }}
          search={false}
          options={false}
          loading={loading}
          dataSource={data?.data}
          pagination={{
            pageSize: size,
            total: data?.totalCount ?? 0,
            onChange(current, size) {
              loadData(current, size);
            },
            onShowSizeChange(current, size) {
              setSize(size);
              loadData(current, size);
            },
          }}
          columns={[
            {
              dataIndex: 'name',
              title: '办事',
            },
            {
              dataIndex: 'changeTime',
              title: '期间',
            },
            {
              dataIndex: 'thingId',
              title: '物的唯一标识',
              render: (_, row) => {
                return (
                  <a
                    onClick={async () => {
                      if (!form) {
                        setFormFile();
                      } else {
                        const data = await props.query.findSnapshot(row.snapshotId);
                        if (data) {
                          for (const field of form.fields) {
                            if (data[field.code]) {
                              data[field.id] = data[field.code];
                            }
                          }
                        }
                        setCenter(
                          <FullScreenModal
                            open
                            fullScreen
                            title={'物快照'}
                            onOk={() => setCenter(<></>)}
                            onCancel={() => setCenter(<></>)}
                            destroyOnClose={true}
                            cancelText={'关闭'}
                            width={1200}>
                            <WorkFormViewer
                              readonly
                              data={data ?? {}}
                              belong={props.query.space}
                              form={form.metadata}
                              fields={form.fields}
                              changedFields={[]}
                              rules={[]}
                            />
                          </FullScreenModal>,
                        );
                      }
                    }}>
                    {row.thingId}
                  </a>
                );
              },
            },
            {
              dataIndex: 'dimension',
              title: '分类',
              render: (_, row) => {
                const speciesId = props.query.species.id;
                const value = row[speciesId];
                if (value && typeof value == 'string') {
                  const node = props.tree.nodeMap.get(value.substring(1));
                  return <>{node?.data.name}</>;
                }
              },
            },
            {
              dataIndex: 'before',
              title: '变动前',
              render: (_, row) => {
                return <span>{formatNumber(row.before ?? 0, 2, true)}</span>;
              },
            },
            {
              dataIndex: 'after',
              title: '变动后',
              render: (_, row) => {
                return <span>{formatNumber(row.after ?? 0, 2, true)}</span>;
              },
            },
            {
              dataIndex: 'change',
              title: '变动值',
              render: (_, row) => {
                return <span>{formatNumber(row.change ?? 0, 2, true)}</span>;
              },
            },
          ]}
        />
      </Modal>
      {center}
    </>
  );
}
