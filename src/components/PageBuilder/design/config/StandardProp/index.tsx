import { useContext } from 'react';
import { DesignContext, PageContext } from '../../../render/PageContext';
import React from 'react';
import { TreeSelect } from 'antd';
import { MenuItem, loadFormsMenu, loadPagesMenu } from '@/config/menus';
import { IDirectory } from '@/ts/core';

interface StandardProps extends IProps {
  loadMenus: (current: IDirectory) => MenuItem;
  placeholder: string;
}

const StandardProp: React.FC<StandardProps> = ({
  value,
  setValue,
  loadMenus,
  placeholder,
}) => {
  const ctx = useContext<DesignContext>(PageContext as any);
  const root = ctx.view.pageInfo.directory.target.directory;
  return (
    <TreeSelect
      style={{ width: '100%' }}
      fieldNames={{
        label: 'label',
        value: 'key',
        children: 'children',
      }}
      showSearch
      value={value}
      placeholder={placeholder}
      allowClear
      treeDefaultExpandAll
      onChange={setValue}
      treeData={[loadMenus(root)]}
    />
  );
};

interface IProps {
  value?: string;
  setValue: (value: string) => void;
}

export const FormProp: React.FC<IProps> = ({ value, setValue }) => {
  return (
    <StandardProp
      value={value}
      setValue={setValue}
      loadMenus={loadFormsMenu}
      placeholder={'选择表单'}
    />
  );
};

export const PageProp: React.FC<IProps> = ({ value, setValue }) => {
  return (
    <StandardProp
      value={value}
      setValue={setValue}
      loadMenus={loadPagesMenu}
      placeholder={'选择模板'}
    />
  );
};

export default FormProp;
