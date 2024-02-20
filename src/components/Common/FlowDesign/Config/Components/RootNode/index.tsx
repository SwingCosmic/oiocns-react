import React, { useState } from 'react';
import { Card, Divider } from 'antd';
import cls from './index.module.less';
import { NodeModel } from '../../../processType';
import ShareShowComp, { FormOption } from '@/components/Common/ShareShowComp';
import { IBelong, IForm, IWork } from '@/ts/core';
import OpenFileDialog from '@/components/OpenFileDialog';
import { command, model, schema } from '@/ts/base';
import { Form } from '@/ts/core/thing/standard/form';
import { SelectBox } from 'devextreme-react';
import { getUuid } from '@/utils/tools';
import Rule from '../../Rule';
import ExecutorShowComp from '@/components/Common/ExecutorShowComp';
import ExecutorConfigModal from '../ApprovalNode/configModal';
interface IProps {
  work: IWork;
  belong: IBelong;
  current: NodeModel;
  refresh: () => void;
}
/**
 * @description: 角色
 * @return {*}
 */

const RootNode: React.FC<IProps> = (props) => {
  const rule = JSON.parse(props.work.metadata.rule ?? '{}');
  const [formModel, setFormModel] = useState<string>('');
  props.current.primaryForms = props.current.primaryForms || [];
  props.current.detailForms = props.current.detailForms || [];
  const [primaryForms, setPrimaryForms] = useState(props.current.primaryForms);
  const [detailForms, setDetailForms] = useState(props.current.detailForms);
  const [applyType, setApplyType] = useState<string>(rule.applyType ?? '默认');
  const [executors, setExecutors] = useState<model.Executor[]>(
    props.current.executors ?? [],
  );
  const [executorModal, setExecutorModal] = useState(false);
  const formViewer = React.useCallback((form: schema.XForm) => {
    command.emitter(
      'executor',
      'open',
      new Form({ ...form, id: '_' + form.id }, props.belong.directory),
      'preview',
    );
  }, []);
  return (
    <div className={cls[`app-roval-node`]}>
      <div className={cls[`roval-node`]}>
        <Card type="inner" title="打开类型" className={cls['card-info']} extra={<></>}>
          <SelectBox
            showClearButton
            value={applyType}
            dataSource={[
              { text: '默认', value: '默认' },
              { text: '选择', value: '选择' },
              { text: '列表', value: '列表' },
              { text: '财务', value: '财务' },
            ]}
            displayExpr={'text'}
            valueExpr={'value'}
            onValueChange={(e) => {
              rule.applyType = e;
              props.work.metadata.rule = JSON.stringify(rule);
              setApplyType(e);
            }}
          />
        </Card>
        <Card
          type="inner"
          title={
            <div>
              <Divider type="vertical" className={cls['divider']} />
              <span>主表配置</span>
            </div>
          }
          className={cls['card-info']}
          bodyStyle={{ padding: '12px' }}
          extra={
            <a
              onClick={() => {
                setFormModel('主表');
              }}>
              + 添加
            </a>
          }
          actions={[<>当进行选择操作时，新增创建新的物，变更修改旧的物。</>]}>
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
              <span>子表配置</span>
            </div>
          }
          className={cls[`card-info`]}
          bodyStyle={{ padding: detailForms.length ? '12px' : '0' }}
          extra={
            <a
              onClick={() => {
                setFormModel('子表');
              }}>
              + 添加
            </a>
          }>
          {detailForms.length > 0 && (
            <span>
              <ShareShowComp
                departData={detailForms}
                onClick={formViewer}
                deleteFuc={(id: string) => {
                  props.current.detailForms = detailForms?.filter((a) => a.id != id);
                  props.current.forms = props.current.forms.filter((a) => {
                    return !(a.typeName == '子表' && a.id == id);
                  });
                  setDetailForms(props.current.detailForms);
                }}
                tags={(id) => {
                  const info = props.current.forms.find(
                    (a) => a.typeName == '子表' && a.id == id,
                  );
                  if (info) {
                    return <FormOption operateRule={info} typeName="子表" />;
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
          bodyStyle={{ padding: executors && executors.length ? '24px' : '0' }}
          extra={
            <>
              <a
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
                  var exes = executors.filter((a) => a.id != id);
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
          primaryForms={primaryForms}
          detailForms={detailForms}
        />
        {formModel != '' && (
          <OpenFileDialog
            multiple
            title={`选择${formModel}表单`}
            rootKey={props.belong.directory.key}
            accepts={['表单', '报表']}
            excludeIds={(formModel === '子表' ? detailForms : primaryForms).map(
              (i) => i.id,
            )}
            onCancel={() => setFormModel('')}
            onOk={(files) => {
              if (files.length > 0) {
                const forms = (files as unknown[] as IForm[]).map((i) => i.metadata);
                const setFormInfos = (bool: boolean) => {
                  props.current.forms = [
                    ...props.current.forms,
                    ...forms.map((item) => {
                      return {
                        id: item.id,
                        typeName: formModel,
                        allowAdd: true,
                        allowEdit: bool,
                        allowSelect: bool,
                      };
                    }),
                  ];
                };
                if (formModel === '子表') {
                  props.current.detailForms = [...props.current.detailForms, ...forms];
                  setFormInfos(true);
                  setDetailForms(props.current.detailForms);
                } else {
                  props.current.primaryForms = [...props.current.primaryForms, ...forms];
                  setFormInfos(false);
                  setPrimaryForms(props.current.primaryForms);
                }
              }
              setFormModel('');
            }}
          />
        )}
        {executorModal ? (
          <ExecutorConfigModal
            refresh={(param) => {
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
    </div>
  );
};
export default RootNode;
