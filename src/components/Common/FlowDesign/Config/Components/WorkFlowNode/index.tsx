import React, { useState } from 'react';
import { AiOutlineSetting } from 'react-icons/ai';
import { Row, Button, Space, Divider, Card } from 'antd';
import cls from './index.module.less';
import { NodeModel } from '../../../processType';
import { IBelong, IWork } from '@/ts/core';
import ShareShowComp from '@/components/Common/ShareShowComp';
import OpenFileDialog from '@/components/OpenFileDialog';

interface IProps {
  current: NodeModel;
  define: IWork;
  belong: IBelong;
  refresh: () => void;
}

/**
 * @description: 子流程对象
 * @return {*}
 */

const WorkFlowNode: React.FC<IProps> = (props) => {
  const [isOpen, setIsOpen] = useState<boolean>(false); // 打开弹窗
  const [currentData, setCurrentData] = useState({
    id: props.current.destId,
    name: props.current.destName,
  });

  if (props.current.code.startsWith('JGNODE')) return <></>;
  return (
    <div className={cls[`app-roval-node`]}>
      <div className={cls[`roval-node`]}>
        <Card
          type="inner"
          style={{ border: 'none' }}
          headStyle={{
            backgroundColor: '#FCFCFC',
            padding: '0px 12px',
            borderBottom: 'none',
          }}
          title={
            <div>
              <Divider type="vertical" className={cls['divider']} />
              <span>其他办事</span>
            </div>
          }
          className={cls['card-info']}
          bodyStyle={{ padding: '0px 12px 12px 0px', border: 'none' }}
          extra={
            <a
              onClick={() => {
                setIsOpen(true);
              }}>
              + 选择其他办事
            </a>
          }>
          <div>
            {currentData.id ? (
              <ShareShowComp
                departData={[currentData]}
                deleteFuc={() => {
                  props.current.destId = '';
                  props.current.destName = '';
                  setCurrentData({ id: '', name: '' });
                  props.refresh();
                }}></ShareShowComp>
            ) : null}
          </div>
        </Card>
      </div>
      {isOpen && (
        <OpenFileDialog
          title={'选中其它办事'}
          rootKey={'disk'}
          accepts={['办事']}
          allowInherited
          excludeIds={[props.define.id]}
          onCancel={() => setIsOpen(false)}
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
            props.refresh();
            setIsOpen(false);
          }}
        />
      )}
    </div>
  );
};
export default WorkFlowNode;
