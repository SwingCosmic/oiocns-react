import OpenFileDialog, { IFileDialogProps } from '@/components/OpenFileDialog';
import { schema } from '@/ts/base';
import { Tooltip } from 'antd';
import React, { ReactNode, useContext, useState } from 'react';
import { PageContext } from '../../../render/PageContext';
import { IExistTypeProps } from '../IExistTypeEditor';
import cls from './index.module.less';

export interface SEntity extends Pick<schema.XEntity, 'id' | 'name'> {}

export interface SProperty extends SEntity {
  valueType: string;
}

interface IProps extends Omit<IFileDialogProps, 'rootKey' | 'onCancel'> {
  children: ReactNode;
}

export const File: React.FC<IProps> = (props) => {
  const ctx = useContext(PageContext);
  const [center, setCenter] = useState(<></>);
  return (
    <>
      <div
        onClick={() => {
          setCenter(
            <OpenFileDialog
              {...props}
              rootKey={ctx.view.pageInfo.directory.spaceKey}
              onOk={(files) => {
                if (files.length > 0) {
                  props.onOk(files);
                }
                setCenter(<></>);
              }}
              onCancel={() => setCenter(<></>)}
            />,
          );
        }}>
        {props.children}
      </div>
      {center}
    </>
  );
};

export interface TextProps {
  value?: string;
  width?: string | number;
  height?: string | number;
}

export const TipDesignText: React.FC<TextProps> = (props) => {
  return (
    <Tooltip title={props.value}>
      <div
        style={{ height: props.height, width: props.width }}
        className={cls.designText}>
        <div className={cls.textOverflow}>{props.value}</div>
      </div>
    </Tooltip>
  );
};

export const TipText: React.FC<{ value?: string }> = (props) => {
  return (
    <Tooltip title={props.value}>
      <div className={cls.viewText}>
        <div className={cls.textOverflow}>{props.value}</div>
      </div>
    </Tooltip>
  );
};

export const Picture: React.FC<IExistTypeProps<schema.XEntity>> = (props) => {
  return (
    <File onOk={(f) => props.onChange(f[0].metadata)} accepts={['图片']}>
      <TipDesignText value={props.value?.name} />
    </File>
  );
};
