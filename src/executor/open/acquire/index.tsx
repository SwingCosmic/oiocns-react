import CurrentTargetItem from '@/components/DataStandard/WorkForm/Viewer/customItem/currentTarget';
import { kernel, model } from '@/ts/base';
import { IAcquire } from '@/ts/core/work/acquire';
import { Divider, Modal, Space, Tag, message } from 'antd';
import React from 'react';
import orgCtrl from '@/ts/controller';

interface IProps {
  acquire: IAcquire;
  finished: () => void;
}

const Acquire: React.FC<IProps> = (props) => {
  return (
    <Modal
      width={'40vw'}
      open
      title={'发起领用'}
      onOk={() => {
        kernel.createWorkInstance({
          content: '',
          contentType: '',
          data: '',
          title: '',
          hook: '',
          taskId: '',
          applyId: orgCtrl.user.id,
        } as model.WorkInstanceModel);
        message.success('发起成功！');
        props.finished();
      }}
      onCancel={props.finished}>
      <Space style={{ width: '100%' }} direction="vertical">
        <Divider orientation="left" plain>
          数据来源方
        </Divider>
        <CurrentTargetItem target={props.acquire.directory.target.metadata} />
        <Divider orientation="left" plain>
          数据接收方
        </Divider>
        <CurrentTargetItem target={props.acquire.directory.target.space.metadata} />
        <Divider orientation="left" plain>
          待领取数据表单
        </Divider>
        <Space wrap>
          {props.acquire.metadata.forms.map((item, index) => {
            return (
              <Tag
                style={{
                  borderStyle: 'dashed',
                  borderWidth: 1,
                  borderColor: '#D3D3D3',
                  backgroundColor: 'white',
                }}
                key={index}>
                {item.name}
              </Tag>
            );
          })}
        </Space>
      </Space>
    </Modal>
  );
};

export default Acquire;
