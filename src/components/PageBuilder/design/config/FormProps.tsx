import { useContext } from 'react';
import { DesignContext, PageContext } from '../../render/PageContext';
import React from 'react';
import { TreeSelect } from 'antd';
import { MenuItemType } from 'typings/globelType';
import { IDirectory, IEntity } from '@/ts/core';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import { XEntity } from '@/ts/base/schema';

interface IProps {
  value?: string;
  onChange: (value: string) => void;
}

export type MenuItem = MenuItemType & { selectable: boolean };

/** 多类型菜单 */
export const loadFormMenus = (current: IDirectory): MenuItem => {
  return {
    key: current.id,
    item: current,
    label: current.name,
    itemType: current.typeName,
    icon: <EntityIcon entityId={current.id} typeName={current.typeName} size={18} />,
    children: [
      ...current.children.map((item) => loadFormMenus(item)),
      ...current.forms.map(loadEntity),
    ],
    selectable: false,
  };
};

export const loadEntity = (entity: IEntity<XEntity>): MenuItem => {
  return {
    key: entity.id,
    item: entity,
    label: entity.name,
    itemType: entity.typeName,
    icon: <EntityIcon entityId={entity.id} typeName={entity.typeName} size={18} />,
    children: [],
    selectable: true,
  };
};

const FormProps: React.FC<IProps> = ({ value, onChange }) => {
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
      placeholder="选择表单"
      treeDefaultExpandAll
      onChange={onChange}
      treeData={[loadFormMenus(root)]}
    />
  );
};

export default FormProps;
