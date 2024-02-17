import React, { useState } from 'react';
import { schema } from '@/ts/base';
import orgCtrl from '@/ts/controller';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import WorkFormViewer from '@/components/DataStandard/WorkForm/Viewer';
import { XForm } from '@/ts/base/schema';
import { IBelong, IForm } from '@/ts/core';
import { Form } from '@/ts/core/thing/standard/form';
import FullScreenModal from '@/components/Common/fullScreen';
import { message } from 'antd';

interface Iprops {
  entity: schema.XThing;
  finished: () => void;
}
const ThingPreview: React.FC<Iprops> = ({ entity, finished }) => {
  const [form, setForm] = useState<XForm>();
  const [formInst, setFormInst] = useState<IForm>();
  const [formBelong, setFormBelong] = useState<IBelong>();
  const info = {
    id: entity?.formId,
    typeName: '主表',
    allowAdd: false,
    allowEdit: false,
    allowSelect: false,
  };
  // 初始化
  const [loaded] = useAsyncLoad(async () => {
    const { formId: targetFormId, belongId } = entity;
    const belong = orgCtrl.user.companys.find((a) => a.id == belongId) || orgCtrl.user;
    setFormBelong(belong);
    if (targetFormId && belong) {
      let formList: XForm[] = [];
      formList = await belong?.resource.formColl.find([targetFormId]);
      if (formList.length && belong) {
        const useForm = formList[0];
        // 设置表单
        setForm(useForm);
        const formInst = new Form({ ...useForm, id: useForm.id + '_' }, belong.directory);
        await formInst.loadFields();
        // 设置表单实例
        setFormInst(formInst);
        return formInst;
      }
    }
  });

  if (!loaded) {
    return <></>;
  } else if (!(form && formInst)) {
    message.warning('出现错误，必要参数缺失😥');
    return <></>;
  }

  return (
    <FullScreenModal
      open
      onCancel={() => finished && finished()}
      width={'80vw'}
      bodyStyle={{
        maxHeight: '100vh',
      }}
      title={'数据详情'}>
      <WorkFormViewer
        form={form!}
        fields={formInst?.fields!}
        info={info}
        data={entity}
        changedFields={[]}
        rules={[]}
        belong={formBelong!}
        readonly
      />
    </FullScreenModal>
  );
};

export default ThingPreview;
