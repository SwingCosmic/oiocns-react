import { model } from '@/ts/base';
import React, { useEffect, useState, useMemo } from 'react';
import { Input, Tree } from 'antd';
import type { TreeProps } from 'antd';
import { ISelectBoxOptions } from 'devextreme-react/select-box';
import { getParentKey, organizeData } from './utils';

interface TreeSelectItemProps extends ISelectBoxOptions {
  speciesItems: model.FiledLookup[];
  selectValue: string;
}

const TreeTargetItem: React.FC<TreeSelectItemProps> = (props) => {
  const [dataSourceArray, setDataSourceArray] = useState<model.FiledLookup[][] | any>([]);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState<string>('');
  const [autoExpandParent, setAutoExpandParent] = useState(true);
  const [checkedKeys, setCheckedKeys] = useState<React.Key[]>([]);

  useEffect(() => {
    const newData = organizeData(props.speciesItems);
    setDataSourceArray(newData);
  }, [props.speciesItems]);

  const onExpand = (newExpandedKeys: React.Key[]) => {
    setExpandedKeys(newExpandedKeys);
    setAutoExpandParent(false);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value?.toLowerCase();
    const expandedKeys = props.speciesItems
      .map((item: any) => {
        if (item.text.indexOf(value) > -1) {
          return getParentKey(item.value, dataSourceArray);
        }
        return null;
      })
      .filter((item: any, i: any, self: any) => item && self.indexOf(item) === i);
    if (value) {
      setExpandedKeys(expandedKeys);
      setSearchValue(value);
      setAutoExpandParent(true);
    } else {
      setExpandedKeys([]);
      setSearchValue('');
      setAutoExpandParent(false);
    }
  };

  const filterTreeNode = (node: any) => {
    const title = node.title.props.children[2];
    const result = title.indexOf(searchValue) !== -1 ? true : false;
    return result;
  };

  const treeData = useMemo(() => {
    setTimeout(() => {
      setCheckedKeys([props.selectValue ? props.selectValue : props.defaultValue]);
      setExpandedKeys([props.selectValue ? props.selectValue : props.defaultValue]);
    }, 100);
    const loop = (data: any) =>
      data.map((item: any) => {
        const strTitle = item.text as string;
        const index = strTitle.indexOf(searchValue);
        const beforeStr = strTitle.substring(0, index);
        const afterStr = strTitle.slice(index + searchValue.length);
        const title =
          index > -1 ? (
            <span>
              {beforeStr}
              <span className="site-tree-search-value">{searchValue}</span>
              {afterStr}
            </span>
          ) : (
            <span>{strTitle}</span>
          );
        if (item.children) {
          return { title, key: item.value, children: loop(item.children) };
        }
        return {
          title,
          key: item.value,
        };
      });
    return loop(dataSourceArray);
  }, [dataSourceArray]);

  const onSelect: TreeProps['onSelect'] = (_selectedKeys, info: any) => {
    setCheckedKeys([info.node.key]);
    const value = info.node.key;
    const title = info.node.title?.props?.children?.at(-1);
    props.onValueChanged?.apply(this, [{ value, title } as any]);
  };

  const onCheck: TreeProps['onCheck'] = (_checkedKeys, info: any) => {
    setCheckedKeys([info.node.key]);
    const value = info.node.key;
    const title = info.node.title?.props?.children?.at(-1);
    props.onValueChanged?.apply(this, [{ value, title } as any]);
  };

  return (
    <div>
      <Input style={{ marginBottom: 8 }} placeholder="请输入..." onChange={onChange} />
      <Tree
        checkable
        onExpand={onExpand}
        expandedKeys={expandedKeys}
        autoExpandParent={autoExpandParent}
        onSelect={onSelect}
        onCheck={onCheck}
        treeData={treeData}
        checkedKeys={checkedKeys}
        filterTreeNode={filterTreeNode}
        blockNode
      />
    </div>
  );
};

export default TreeTargetItem;
