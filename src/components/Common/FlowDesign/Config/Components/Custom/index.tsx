import React, { useEffect, useState } from 'react';
import { Card, Divider } from 'antd';
import cls from './index.module.less';
import { NodeModel } from '@/components/Common/FlowDesign/processType';
import ShareShowComp, { FormOption } from '@/components/Common/ShareShowComp';
import { IBelong, IWork } from '@/ts/core';
import { command, model, schema } from '@/ts/base';
import { IForm, Form as SForm } from '@/ts/core/thing/standard/form';
import OpenFileDialog from '@/components/OpenFileDialog';
import { SelectBox } from 'devextreme-react';
import { getUuid } from '@/utils/tools';
import Rule from '../../Rule';
import ExecutorConfigModal from './configModal';
import ExecutorShowComp from '@/components/Common/ExecutorShowComp';
interface IProps {
  work: IWork;
  current: NodeModel;
  belong: IBelong;
  refresh: () => void;
}

/**
 * @description: 审批对象
 * @return {*}
 */

const CustomNode: React.FC<IProps> = (props) => {
  const [executors, setExecutors] = useState<model.Executor[]>([]);
  const [formModel, setFormModel] = useState<string>('');
  const [primaryForms, setPrimaryForms] = useState<schema.XForm[]>();
  const [destType, setDestType] = useState(props.current.destType);
  const [executorModal, setExecutorModal] = useState(false);
  useEffect(() => {
    props.current.primaryForms = props.current.primaryForms || [];
    props.current.executors = props.current.executors || [];
    setExecutors(props.current.executors);
    setPrimaryForms(props.current.primaryForms);
  }, [props.current]);
  const formViewer = React.useCallback((form: schema.XForm) => {
    command.emitter(
      'executor',
      'open',
      new SForm({ ...form, id: '_' + form.id }, props.belong.directory),
      'preview',
    );
  }, []);

  return (
    <div className={cls[`app-roval-node`]}>
      <div className={cls[`roval-node`]}>
        <Card
          type="inner"
          title="审批对象"
          className={cls[`card-info`]}
          extra={
            <>
              <SelectBox
                value={destType}
                valueExpr={'value'}
                displayExpr={'label'}
                style={{ width: 120, display: 'inline-block' }}
                onSelectionChanged={(e) => {
                  props.current.destType = e.selectedItem.value;
                  if (destType != e.selectedItem.value) {
                    setDestType(e.selectedItem.value);
                    props.refresh();
                  }
                }}
                dataSource={[
                  // { value: '身份', label: '角色' },
                  { value: '人员', label: '人员' },
                ]}
              />
            </>
          }></Card>
        <Card
          type="inner"
          title="表单管理"
          className={cls[`card-info`]}
          extra={
            <a
              onClick={() => {
                setFormModel('主表');
              }}>
              + 添加
            </a>
          }>
          {primaryForms && primaryForms.length > 0 && (
            <span>
              <ShareShowComp
                departData={primaryForms}
                onClick={formViewer}
                deleteFuc={(id: string) => {
                  props.current.primaryForms = primaryForms?.filter((a) => a.id != id);
                  props.current.forms = props.current.forms.filter((a) => {
                    return !(a.typeName == '主表' && a.id == id);
                  });
                  setPrimaryForms(props.current.primaryForms);
                }}
                tags={(id) => {
                  const info = props.current.forms.find(
                    (a) => a.typeName == '主表' && a.id == id,
                  );
                  if (info) {
                    return <FormOption operateRule={info} typeName="主表" />;
                  }
                }}
              />
            </span>
          )}
        </Card>
        <Card
          type="inner"
          title={
            <div>
              <Divider type="vertical" className={cls['divider']} />
              <span>执行器配置</span>
            </div>
          }
          className={cls[`card-info`]}
          extra={
            <>
              <a
                type="link"
                onClick={() => {
                  setExecutorModal(true);
                }}>
                + 添加
              </a>
            </>
          }>
          {executors && executors.length > 0 && (
            <span>
              <ExecutorShowComp
                work={props.work}
                executors={executors}
                deleteFuc={(id: string) => {
                  const exes = executors.filter((a) => a.id != id);
                  setExecutors(exes);
                  props.current.executors = exes;
                }}
              />
            </span>
          )}
        </Card>
        <Rule
          work={props.work}
          current={props.current}
          primaryForms={primaryForms ?? []}
          detailForms={[]}
        />
      </div>
      {formModel != '' && (
        <OpenFileDialog
          multiple
          title={`选择表单`}
          rootKey={props.belong.directory.key}
          accepts={['表单']}
          excludeIds={primaryForms?.map((i) => i.id)}
          onCancel={() => setFormModel('')}
          onOk={(files) => {
            if (files.length > 0) {
              const forms = (files as unknown[] as IForm[]).map((i) => i.metadata);
              props.current.primaryForms.push(...forms);
              setPrimaryForms(props.current.primaryForms);
              props.current.forms = [
                ...props.current.forms,
                ...forms.map((item) => {
                  return {
                    id: item.id,
                    typeName: formModel,
                    allowAdd: false,
                    allowEdit: false,
                    allowSelect: false,
                  };
                }),
              ];
            }
            setFormModel('');
          }}
        />
      )}
      {executorModal ? (
        <ExecutorConfigModal
          refresh={(param) => {
            console.log('params', param);
            if (param) {
              executors.push({
                id: getUuid(),
                trigger: param.trigger,
                funcName: param.funcName,
                changes: [],
                hookUrl: '',
                belongId: props.belong.id,
                acquires: [],
              });
              setExecutors([...executors]);
              props.current.executors = executors;
            }
            setExecutorModal(false);
          }}
          current={props.current}
        />
      ) : null}
    </div>
  );
};
export default CustomNode;
