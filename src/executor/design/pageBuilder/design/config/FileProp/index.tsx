import OpenFileDialog from '@/components/OpenFileDialog';
import { schema } from '@/ts/base';
import { Input } from 'antd';
import React, { useContext, useState } from 'react';
import { PageContext } from '../../../render/PageContext';
import { IExistTypeProps } from '../IExistTypeEditor';

interface IProps extends IExistTypeProps<schema.XEntity> {
  accepts: string[];
}

const FileProp: React.FC<IProps> = ({ accepts, value, onChange }) => {
  const ctx = useContext(PageContext);
  const [center, setCenter] = useState(<></>);
  const close = () => setCenter(<></>);
  const open = () => {
    setCenter(
      <OpenFileDialog
        accepts={accepts}
        rootKey={ctx.view.pageInfo.directory.spaceKey}
        multiple={false}
        onOk={(files) => {
          if (files.length > 0) {
            onChange(files[0].metadata);
          }
          close();
        }}
        onCancel={close}
      />,
    );
  };
  return (
    <>
      <Input value={value?.name} onClick={open} />
      {center}
    </>
  );
};

export const FormFileProp: React.FC<IExistTypeProps<schema.XEntity>> = (props) => {
  return <FileProp {...props} accepts={['实体配置', '事项配置']} />;
};

export const PicFileProp: React.FC<IExistTypeProps<schema.XEntity>> = (props) => {
  return <FileProp {...props} accepts={['图片']} />;
};

export default FileProp;
