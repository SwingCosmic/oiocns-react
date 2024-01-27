import { Modal } from 'antd';
import React from 'react';
import { kernel, model, schema } from '@/ts/base';
import { IBelong } from '@/ts/core';
import WorkFormViewer from '@/components/DataStandard/WorkForm/Viewer';

interface IFormEditProps {
  form: schema.XForm;
  fields: model.FieldModel[];
  belong: IBelong;
  create: boolean;
  initialValues?: any;
  onSave: (values: any) => void;
}

const FormEditModal = ({
  form,
  fields,
  belong,
  create,
  initialValues,
  onSave,
}: IFormEditProps) => {
  const editData: any = { ...initialValues };
  const modal = Modal.confirm({
    icon: <></>,
    width: '80vw',
    okText: `确认${create ? '新增' : '变更'}`,
    cancelText: '关闭',
    onCancel: () => modal.destroy(),
    content: (
      <div
        style={{ maxHeight: '70vh', width: '100%', overflowY: 'scroll', minHeight: 600 }}>
        <WorkFormViewer
          form={form}
          rules={[]}
          changedFields={[]}
          fields={fields}
          data={editData}
          belong={belong}
        />
      </div>
    ),
    onOk: () => {
      if (create) {
        kernel.createThing(belong.id, [], '').then((res) => {
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            onSave({ ...res.data[0], ...editData });
            modal.destroy();
          }
        });
      } else {
        onSave(editData);
        modal.destroy();
      }
    },
  });
};

export default FormEditModal;
