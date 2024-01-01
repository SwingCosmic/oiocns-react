import { Button, Col, Form, Input, Modal, Row } from "antd";
import React, { useEffect, useState } from "react";
import { AssetLedgerSummary, postfixMap, prefixMap } from "./ledger";
import cls from "./ledger.module.less";
import GenerateThingTable from "@/executor/tools/generate/thingTable";
import CustomStore from "devextreme/data/custom_store";
import { kernel } from "@/ts/base";
import { XForm, XThing } from "@/ts/base/schema";
import { IForm } from "@/ts/core";

interface Props {
  summary: AssetLedgerSummary | null,
  field: string;
  type: string;
  visible: boolean;
  onVisibleChange: (v: boolean) => any;
  form: IForm;
}

export function AssetLedgerModal(props: Props) {
  const { summary, visible, onVisibleChange } = props;
  const [title, setTitle] = useState('');

  const [formInst] = Form.useForm();

  const [data, setData] = useState<XThing[]>([]);

  const [queryForm, setQueryForm] = useState({
    code: '',
    name: ''
  });

  async function loadData() {
    if (!summary) {
      return;
    }

    const fieldName = postfixMap.find(p => props.field == p.postfix)?.label ?? "";
    const typeName = prefixMap.find(p => props.type == p.prefix)?.label ?? "";

    setTitle(() => fieldName + typeName);

    const loadOptions = {
      take: 100,
      skip: 0,
      requireTotalCount: true,
      userData: [`F${props.form.id}`],
      filter: ['belongId', '=', summary.belongId],
    };
    const d = await kernel.loadThing(summary.belongId, [summary.belongId], loadOptions);
    setData(d.data);
  }

  useEffect(() => {
    loadData();
  }, [summary]);
  return (
    <Modal
      title={title}
      className={[cls.assetLedger, 'assetLedgerModal'].join(' ')}
      destroyOnClose={true}
      width="1080px"
      style={{ top: '5vh' }}
      onCancel={() => onVisibleChange(false)}
      footer={[]}
      open={visible}>
      <div className="flex flex-col" style={{ height: '65vh' }}>
        <div>
          <Form form={formInst} initialValues={queryForm}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Form.Item name="code" label="资产编码">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="name" label="资产名称">
                  <Input />
                </Form.Item>
              </Col>
            </Row>
          </Form>
          <Row justify="center">
            <Button type="primary">查询</Button>
          </Row>
        </div>
        <div>
          {props.form ? (
            <GenerateThingTable
              fields={props.form.fields}
              height={'400px'}
              dataIndex="attribute"
              dataSource={
                new CustomStore({
                  key: 'id',
                  async load(_) {
                    return data;
                  },
                })
              }
            />
          ) : <></>}
        </div>
      </div>
    </Modal>
  );
}