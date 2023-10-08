import { signalsToObject, useSignal, useSimpleSignal } from "@/hooks/useSignal";
import { defineFC } from "@/utils/react/fc";
import { Form, Input, Modal } from "antd";
import React, { useContext, useEffect, useState } from "react";
import { PageElement } from "../core/PageElement";
import { DesignContext, PageContext } from "../render/PageContext";

interface Props {
  visible: boolean;
  parentId: string;
  onVisibleChange: (v: boolean) => void;
}

export default defineFC({
  render(props: Props) {

    const ctx = useContext<DesignContext>(PageContext as any);

    const kind = useSimpleSignal("");
    const name = useSimpleSignal("");
    const form = signalsToObject({
      kind,
      name
    });

    const modalVisible = useSimpleSignal(false);
    useEffect(() => {
      modalVisible.current = props.visible;
      if (props.visible) {
        form.name = "新元素";
        form.kind = "";
      }
    }, [props.visible]);

    function visibleChange(v: boolean) {
      modalVisible.current = v;
      props.onVisibleChange?.(v);
    }




    function handleCreate() {
      ctx.view.addElement(form.kind, form.name, props.parentId);
      visibleChange(false);
    }


    return <Modal title="新建元素"
      destroyOnClose={true}
      open={modalVisible.current}
      onCancel={() => visibleChange(false)}
      onOk={handleCreate}>
      <Form initialValues={form}>
        <Form.Item name="name" label="名称" required>
          <Input value={form.name} onChange={v => form.name = v.target.value}/>
        </Form.Item>
        <Form.Item name="kind" label="类型" required>
          <Input value={form.kind} onChange={v => form.kind = v.target.value}/>
        </Form.Item>
      </Form>
    </Modal>
  },
  defaultProps: {
    visible: false
  }
});