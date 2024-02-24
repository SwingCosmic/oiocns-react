import React from 'react';
import { Upload, UploadProps } from 'antd';
import OrgIcons from '../GlobalComps/orgIcons';
import orgCtrl from '@/ts/controller';
import { ISysFileInfo } from '@/ts/core';

interface IProps {
  size: number;
  onSelected: (file: ISysFileInfo) => void;
}

const UploadIcon: React.FC<IProps> = ({ size, onSelected }) => {
  const uploadProps: UploadProps = {
    multiple: false,
    showUploadList: false,
    maxCount: 1,
    async customRequest(options) {
      const file = options.file as File;
      if (file) {
        const result = await orgCtrl.user.directory.createFile(file.name, file);
        if (result) {
          onSelected(result);
        }
      }
    },
  };
  return (
    <Upload {...uploadProps}>
      <OrgIcons type="/toolbar/files" size={size} notAvatar />
    </Upload>
  );
};

export default UploadIcon;
