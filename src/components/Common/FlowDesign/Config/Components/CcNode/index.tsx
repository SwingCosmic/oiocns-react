import React, { useEffect, useState } from 'react';
import { Card } from 'antd';
import cls from './index.module.less';
import { NodeModel } from '../../../processType';
import ShareShowComp from '@/components/Common/ShareShowComp';
import { IBelong, IWork } from '@/ts/core';
import SelectIdentity from '@/components/Common/SelectIdentity';
import { SelectBox } from 'devextreme-react';
import OpenFileDialog from '@/components/OpenFileDialog';

interface IProps {
  work: IWork;
  current: NodeModel;
  belong: IBelong;
  refresh: () => void;
}
/**
 * @description: 抄送对象
 * @return {*}
 */

const CcNode: React.FC<IProps> = (props) => {
  const [destType, setDestType] = useState<string>();
  const [openType, setOpenType] = useState<string>(''); // 打开弹窗
  const [currentData, setCurrentData] = useState<{ id: string; name: string }>();

  useEffect(() => {
    props.current.primaryForms = props.current.primaryForms || [];
    props.current.executors = props.current.executors || [];
    setDestType(props.current.destType ?? '身份');
    setCurrentData({
      id: props.current.destId,
      name: props.current.destName,
    });
  }, [props.current]);

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
      default:
        return <></>;
    }
  };
  return (
    <div className={cls[`app-roval-node`]}>
      <div className={cls[`roval-node`]}>
        <Card
          type="inner"
          title="抄送对象"
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
                  {`+ 选择${destType}`}
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
        </Card>
        {loadDialog()}
      </div>
    </div>
  );
};
export default CcNode;
