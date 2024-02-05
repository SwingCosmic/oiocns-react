import React, { useEffect, useState } from 'react';
import { IForm } from '@/ts/core';
import CardOrTableComp from '@/components/CardOrTableComp';
import { ProColumns } from '@ant-design/pro-components';
import { Button, Card, Typography, Popconfirm } from 'antd';
import useObjectUpdate from '@/hooks/useObjectUpdate';
import { model, schema } from '@/ts/base';
import { PlusOutlined } from '@ant-design/icons';
import { FieldInfo } from 'typings/globelType';
import SpeciesModal from '../../modal/speciesModal';

interface IProps {
  form: IForm;
  fields: FieldInfo[];
}

const SpeciesList: React.FC<IProps> = (props) => {
  const [dataSource, setDataSource] = useState(
    props.form.metadata.options?.dataRange?.species ?? [],
  );
  const [openType, setOpenType] = useState(0);
  const [select, setSelect] = useState<schema.XSpeciesFilter>();
  const [key, forceUpdate] = useObjectUpdate(props.fields);

  /** 展示规则信息列 */
  const ShowRuleColumns: ProColumns<model.Rule>[] = [
    { title: '序号', valueType: 'index', width: 50 },
    { title: '筛选名称', dataIndex: 'name', width: 80 },
    { title: '分类名称', dataIndex: 'speciesName', width: 80 },
    {
      title: '备注',
      dataIndex: 'display',
      width: 80,
      render: (_: any, record: model.Rule) => {
        return (
          <Typography.Text
            style={{ fontSize: 12, color: '#888' }}
            title={record.remark}
            ellipsis>
            {record.remark}
          </Typography.Text>
        );
      },
    },
  ];

  const renderOperate = (info: schema.XSpeciesFilter) => {
    return [
      <Button
        key={'edit'}
        type="link"
        size="small"
        onClick={() => {
          setSelect(info);
          setOpenType(1);
        }}>
        编辑
      </Button>,
      <Popconfirm
        key={'delete'}
        title="确定删除吗？"
        onConfirm={() => {
          const newdata = dataSource.filter((a) => a.id != info.id);
          setDataSource(newdata);
          // props.form.metadata.rule = newdata;
          forceUpdate();
        }}>
        <Button type="text" size="small" danger>
          删除
        </Button>
      </Popconfirm>,
    ];
  };

  const setSpecies = (value: any) => {
    props.form.metadata.options!['dataRange']!['species'] = value;
  };

  useEffect(() => {
    setSpecies(dataSource);
  }, [dataSource]);

  return (
    <>
      <Card
        type="inner"
        title=""
        extra={
          <>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setSelect(undefined);
                setOpenType(1);
              }}>
              添加筛选
            </Button>
          </>
        }>
        <CardOrTableComp<schema.XSpeciesFilter>
          key={key}
          rowKey={'id'}
          dataSource={dataSource}
          scroll={{ y: 'calc(60vh - 150px)' }}
          columns={ShowRuleColumns}
          showBtnType="unfold"
          operation={renderOperate}
        />
      </Card>
      {openType == 1 && (
        <SpeciesModal
          fields={props.fields}
          onCancel={() => setOpenType(0)}
          current={select as schema.XSpeciesFilter}
          onOk={(info) => {
            let _dataSource = [info];
            if (dataSource) {
              _dataSource = [
                ..._dataSource,
                ...dataSource.filter((a) => a.id != info.id),
              ];
            }
            setDataSource(_dataSource);
            forceUpdate();
            setOpenType(0);
          }}
        />
      )}
    </>
  );
};

export default SpeciesList;
