import { IWork, IWorkApply, IWorkTask } from '@/ts/core';
import { Button, Input } from 'antd';
import message from '@/utils/message';
import React from 'react';
import WorkForm from '@/executor/tools/workForm';
import { command, model, schema } from '@/ts/base';
import { loadGatewayNodes } from '@/utils/tools';
import FormItem from '@/components/DataStandard/WorkForm/Viewer/formItem';
import { Emitter } from '@/ts/base/common';
import orgCtrl from '@/ts/controller';
import { AddNodeType } from '@/components/Common/FlowDesign/processType';
// 卡片渲染
interface IProps {
  apply: IWorkApply;
  work: IWork | IWorkTask;
  finished?: () => void;
  onStagging?: () => void;
  content?: string;
  stagging?: schema.XWorkInstance;
}

/** 办事发起-默认类型 */
const DefaultWayStart: React.FC<IProps> = ({
  apply,
  work,
  finished,
  onStagging,
  stagging,
  content = '',
}) => {
  const gatewayData = new Map<string, string>();
  const [notifyEmitter] = React.useState(new Emitter());
  const info: { content: string } = { content };
  const loadGateway = (apply: IWorkApply) => {
    const gatewayInfos = loadGatewayNodes(apply.instanceData.node, []);
    return (
      <>
        {gatewayInfos.map((a) => {
          var field: model.FieldModel = {
            id: a.id,
            code: a.code,
            name: a.name,
            valueType: '用户型',
            widget: '人员搜索框',
            remark: '',
          };
          switch (a.type) {
            case AddNodeType.CUSTOM:
              // TODO 后续支持身份
              break;
            case AddNodeType.GATEWAY:
              field.valueType = '用户型';
              field.widget = '成员选择框';
              field.options = {
                teamId: work.metadata.shareId,
              };
              return;
            default:
              return <></>;
          }
          return (
            <FormItem
              rules={[]}
              key={a.id}
              data={gatewayData}
              numStr={'1'}
              field={field}
              belong={work.directory.target.space}
              notifyEmitter={notifyEmitter}
              onValuesChange={(field, data) => {
                gatewayData.set(field, data);
              }}
            />
          );
        })}
      </>
    );
  };
  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row-reverse',
          position: 'relative',
          top: '16px',
          height: '0px',
          marginRight: '10px',
          zIndex: '1',
        }}>
        {onStagging && (
          <Button
            type="primary"
            style={{ marginLeft: 10 }}
            onClick={async () => {
              const instance = await apply.staggingApply(
                info.content,
                gatewayData,
                orgCtrl.user.workStagging,
                stagging?.id,
              );
              if (instance) {
                orgCtrl.user.workStagging.cache.push(instance);
                onStagging?.apply(this, []);
              }
            }}>
            保存草稿
          </Button>
        )}
        <Button
          type="primary"
          onClick={async () => {
            if (apply.validation()) {
              if (await apply.createApply(apply.belong.id, info.content, gatewayData)) {
                if (stagging) {
                  orgCtrl.user.workStagging.remove(stagging);
                }
                finished?.apply(this, []);
              }
            } else {
              message.warn('请完善表单内容再提交!');
            }
          }}>
          提交
        </Button>
        {'taskdata' in work && (
          <Button
            type="link"
            onClick={async () => {
              command.emitter('executor', 'remark', work);
            }}>
            查看任务详情
          </Button>
        )}
      </div>
      <WorkForm
        allowEdit
        target={work.directory.target}
        belong={apply.belong}
        data={apply.instanceData}
        nodeId={apply.instanceData.node.id}
      />
      {loadGateway(apply)}
      <div style={{ padding: 10, display: 'flex', alignItems: 'flex-end' }}>
        <Input.TextArea
          style={{ height: 100 }}
          placeholder="请填写备注信息"
          defaultValue={content}
          onChange={(e) => {
            info.content = e.target.value;
          }}
        />
      </div>
    </>
  );
};

export default DefaultWayStart;
