import React, { useEffect, useState } from 'react';
import { AiOutlineUser } from 'react-icons/ai';
import { Col, Radio, Form, InputNumber, Card, Divider } from 'antd';
import cls from './index.module.less';
import { NodeModel } from '@/components/Common/FlowDesign/processType';
import ShareShowComp, { FormOption } from '@/components/Common/ShareShowComp';
import { IBelong, IWork } from '@/ts/core';
import SelectIdentity from '@/components/Common/SelectIdentity';
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

const ApprovalNode: React.FC<IProps> = (props) => {
  const [executors, setExecutors] = useState<model.Executor[]>([]);
  const [openType, setOpenType] = useState<string>(''); // 打开弹窗
  const [primaryForms, setPrimaryForms] = useState<schema.XForm[]>([]);
  const [radioValue, setRadioValue] = useState(1);
  const [destType, setDestType] = useState<string>();
  const [currentData, setCurrentData] = useState<{ id: string; name: string }>();
  const [executorModal, setExecutorModal] = useState(false);
  useEffect(() => {
    props.current.primaryForms = props.current.primaryForms || [];
    props.current.executors = props.current.executors || [];
    setDestType(props.current.destType ?? '身份');
    setExecutors(props.current.executors);
    setPrimaryForms(props.current.primaryForms);
    setRadioValue(props.current.num == 0 ? 1 : 2);
    setCurrentData({
      id: props.current.destId,
      name: props.current.destName,
    });
  }, [props.current]);
  const formViewer = React.useCallback((form: schema.XForm) => {
    command.emitter(
      'executor',
      'open',
      new SForm({ ...form, id: '_' + form.id }, props.belong.directory),
      'preview',
    );
  }, []);

  const loadDestType = () => {
    switch (destType) {
      case '身份': {
        return (
          <>
            <Divider />
            <div className={cls['roval-node-select']}>
              <Col className={cls['roval-node-select-col']}></Col>
              <Radio.Group
                onChange={(e) => {
                  if (e.target.value == 1) {
                    props.current.num = 0;
                  } else {
                    props.current.num = 1;
                  }
                  setRadioValue(e.target.value);
                }}
                style={{ paddingBottom: '10px' }}
                value={radioValue}>
                <Radio value={1} style={{ width: '100%' }}>
                  全部: 需征得该角色下所有人员同意
                </Radio>
                <Radio value={2}>部分会签: 指定审批该节点的人员的数量</Radio>
              </Radio.Group>
              {radioValue === 2 && (
                <Form.Item label="会签人数">
                  <InputNumber
                    min={1}
                    onChange={(e: number | null) => {
                      props.current.num = e ?? 1;
                    }}
                    value={props.current.num}
                    placeholder="请设置会签人数"
                    addonBefore={<AiOutlineUser />}
                    style={{ width: '60%' }}
                  />
                </Form.Item>
              )}
            </div>
          </>
        );
      }
      case '发起人':
        return <a>发起人</a>;
      default:
        return <></>;
    }
  };

  const loadDialog = () => {
    switch (openType) {
      case '身份':
        return (
          <SelectIdentity
            open={openType == '身份'}
            exclude={[]}
            multiple={false}
            space={props.belong}
            finished={(selected) => {
              if (selected.length > 0) {
                const item = selected[0];
                props.current.destType = '身份';
                props.current.destId = item.id;
                props.current.destName = item.name;
                setCurrentData(item);
                props.refresh();
              }
              setOpenType('');
            }}
          />
        );
      case '其他办事':
        return (
          <OpenFileDialog
            title={'选中其它办事'}
            rootKey={'disk'}
            accepts={['办事']}
            allowInherited
            excludeIds={[props.work.id]}
            onCancel={() => setOpenType('')}
            onOk={(files) => {
              if (files.length > 0) {
                const work = files[0] as IWork;
                let name = `${work.name} [${work.directory.target.name}]`;
                props.current.destId = work.id;
                props.current.destName = name;
                setCurrentData({ id: work.id, name: name });
              } else {
                setCurrentData({
                  id: '',
                  name: '',
                });
              }
              setOpenType('');
              props.refresh();
            }}
          />
        );
      case '主表':
      case '子表':
        return (
          <OpenFileDialog
            multiple
            title={`选择表单`}
            rootKey={props.belong.directory.key}
            accepts={['表单']}
            excludeIds={primaryForms.map((i) => i.id)}
            onCancel={() => setOpenType('')}
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
                      typeName: openType,
                      allowAdd: false,
                      allowEdit: false,
                      allowSelect: false,
                    };
                  }),
                ];
              }
              setOpenType('');
            }}
          />
        );
      default:
        return <></>;
    }
  };

  const loadExecutor = () => {
    return (
      <>
        <Card
          type="inner"
          title={
            <div>
              <Divider type="vertical" className={cls['divider']} />
              <span>执行器配置</span>
            </div>
          }
          className={cls[`card-info`]}
          bodyStyle={{ padding: '12px' }}
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
        {executorModal && (
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
        )}
      </>
    );
  };

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
                  switch (e.selectedItem.value) {
                    case '身份':
                      props.current.destType = '身份';
                      setCurrentData(undefined);
                      break;
                    case '其他办事':
                      props.current.destType = '其他办事';
                      setCurrentData(undefined);
                      break;
                    case '发起人':
                      props.current.num = 1;
                      props.current.destId = '1';
                      props.current.destName = '发起人';
                      props.current.destType = '发起人';
                      setCurrentData({ id: '1', name: '发起人' });
                      break;
                    default:
                      break;
                  }
                  if (destType != e.selectedItem.value) {
                    setDestType(e.selectedItem.value);
                    props.refresh();
                  }
                }}
                dataSource={[
                  { value: '身份', label: '指定角色' },
                  { value: '其他办事', label: '其他办事' },
                  { value: '发起人', label: '发起人' },
                ]}
              />
              {destType && destType !== '发起人' && (
                <a
                  style={{ paddingLeft: 10, display: 'inline-block' }}
                  onClick={() => {
                    setOpenType(destType);
                  }}>
                  {`+ 选择${destType === '身份' ? '角色' : destType}`}
                </a>
              )}
            </>
          }>
          {currentData && currentData.id != '1' && (
            <ShareShowComp
              key={'审批对象'}
              departData={[currentData]}
              deleteFuc={(_) => {
                props.current.destId = '';
                props.current.destName = '';
                setCurrentData(undefined);
                props.refresh();
              }}
            />
          )}
          {loadDestType()}
        </Card>
        <Card
          type="inner"
          title="表单管理"
          className={cls[`card-info`]}
          extra={
            <a
              onClick={() => {
                setOpenType('主表');
              }}>
              + 添加
            </a>
          }>
          {primaryForms.length > 0 && (
            <span>
              <ShareShowComp
                key={'表单'}
                departData={primaryForms}
                onClick={formViewer}
                deleteFuc={(id: string) => {
                  props.current.primaryForms = primaryForms.filter((a) => a.id != id);
                  props.current.forms = props.current.forms.filter((a) => a.id != id);
                  setPrimaryForms(props.current.primaryForms);
                }}
                tags={(id) => {
                  const info = props.current.forms.find((a) => a.id == id);
                  if (info) {
                    return <FormOption operateRule={info} typeName="主表" />;
                  }
                }}
              />
            </span>
          )}
        </Card>
        {loadExecutor()}
        {loadDialog()}
        <Rule
          work={props.work}
          current={props.current}
          primaryForms={primaryForms}
          detailForms={[]}
        />
      </div>
    </div>
  );
};
export default ApprovalNode;
