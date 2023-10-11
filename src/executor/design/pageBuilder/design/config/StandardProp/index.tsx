import { useContext } from 'react';
import { DesignContext, PageContext } from '../../../render/PageContext';
import React from 'react';
import { TreeSelect } from 'antd';
import { MenuItem, loadFormsMenu, loadPagesMenu } from '@/config/menus';
import { IDirectory } from '@/ts/core';
import { IExistTypeEditor } from '../IExistTypeEditor';

interface StandardProps {
  loadMenus: (current: IDirectory) => MenuItem;
  placeholder: string;
}

const StandardProp: IExistTypeEditor<string, StandardProps> = ({
  value,
  onChange,
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
      onChange={onChange}
      treeData={[loadMenus(root)]}
    />
  );
};

export const FormProp: IExistTypeEditor<string> = ({ value, onChange }) => {
  return (
    <StandardProp
      value={value}
      onChange={onChange}
      loadMenus={loadFormsMenu}
      placeholder={'选择表单'}
    />
  );
};

export const PageProp: IExistTypeEditor<string> = ({ value, onChange }) => {
  return (
    <StandardProp
      value={value}
      onChange={onChange}
      loadMenus={loadPagesMenu}
      placeholder={'选择模板'}
    />
  );
};

export default FormProp;
