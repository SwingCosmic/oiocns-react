import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import { schema } from '@/ts/base';
import orgCtrl from '@/ts/controller';
import { Input, Tree } from 'antd';
import type { TreeProps } from 'antd';
import { ISelectBoxOptions } from 'devextreme-react/select-box';
import React, { useEffect, useState, useMemo } from 'react';
import { getParentKey, organizeData } from './utils';

interface memberBoxProps extends ISelectBoxOptions {
  teamId?: string;
  isOperator?: boolean;
  target: schema.XTarget;
  selectValue: string;
}

const MemberItem: React.FC<memberBoxProps> = (props) => {
  // const [selectTarget, setSelectTarget] = useState<schema.XTarget>();
  const [targets, setTargets] = useState<schema.XTarget[]>([]);
  const [dataSourceArray, setDataSourceArray] = useState<schema.XTarget[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState<string>('');
  const [autoExpandParent, setAutoExpandParent] = useState(true);
  const [checkedKeys, setCheckedKeys] = useState<React.Key[]>([]);

  useEffect(() => {
    if (props.readOnly) {
      if (props.defaultValue && props.defaultValue.length > 5) {
        orgCtrl.user.findEntityAsync(props.defaultValue).then((value) => {
          // setSelectTarget(value as schema.XTarget);
        });
      }
    } else {
      if (props.isOperator) {
        setDataSourceArray(organizeData([props.target]));
        setTargets([props.target]);
        // setSelectTarget(props.target);
      } else if (props.teamId) {
        const target = orgCtrl.targets.find((i) => i.id === props.teamId);
        if (target) {
          // setSelectTarget(undefined);
          setTargets([...target.members]);
          setDataSourceArray(organizeData([...target.members]));
        }
      }
    }
  }, [props]);

  const onExpand = (newExpandedKeys: React.Key[]) => {
    setExpandedKeys(newExpandedKeys);
    setAutoExpandParent(false);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value?.toLowerCase();
    const expandedKeys = targets
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

  const treeData = useMemo(() => {
    setCheckedKeys([props.selectValue ? props.selectValue : props.defaultValue]);
    const loop = (data: any) =>
      data.map((item: any) => {
        const strTitle = item.name as string;
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
          return {
            title,
            key: item.id,
            icon: <EntityIcon entity={item} />,
            children: loop(item.children),
          };
        }
        return {
          title,
          key: item.id,
          icon: <EntityIcon entity={item} />,
        };
      });
    return loop(dataSourceArray);
  }, [dataSourceArray]);

  const filterTreeNode = (node: any) => {
    const title = node.title.props.children[2];
    const result = title.indexOf(searchValue) !== -1 ? true : false;
    return result;
  };

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
        showIcon
        onExpand={onExpand}
        expandedKeys={expandedKeys}
        autoExpandParent={autoExpandParent}
        checkedKeys={checkedKeys}
        onSelect={onSelect}
        onCheck={onCheck}
        treeData={treeData}
        filterTreeNode={filterTreeNode}
        blockNode
      />
    </div>
  );
};

export default MemberItem;
