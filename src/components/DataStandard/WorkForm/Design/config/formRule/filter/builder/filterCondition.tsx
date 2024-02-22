import React, { useEffect, useState } from 'react';
import ConditionTree from './conditionTree';
import './index.less';

interface IProps {
  speciesTreeData: any;
  displayText: string;
  onChange: (value: any) => void;
}

const FilterCondition: React.FC<IProps> = (props) => {
  const [conditionData, setConditionData] = useState<any>({
    relation: 'and',
    isTop: true,
    type: 'group',
    children: [],
  });

  // 根据选中值，生成视图结构数据;
  const resetTreeData = (obj: any) => {
    let result: any[] = [];
    Object.keys(obj).forEach((key) => {
      if (['and', 'or'].includes(key)) {
        let _it: {
          relation: string;
          type: string;
          isTop?: Boolean;
          _tempId?: string;
          children: any[];
        } = {
          relation: key,
          type: 'group',
          children: [],
        };
        if (obj.isTop) {
          _it['isTop'] = obj.isTop;
        }
        _it['_tempId'] = obj._tempId ?? String(1);
        obj[key].forEach((item: any, inx: number) => {
          if (Array.isArray(item)) {
            _it.children.push({
              type: 'condition',
              value: item,
              _tempId: _it._tempId + '-' + String(inx),
            });
          } else {
            const group = resetTreeData({
              ...item,
              _tempId: _it._tempId + '-' + String(inx),
            });
            _it.children = [..._it.children, ...group];
          }
        });
        result.push(_it);
      }
    });
    return result;
  };

  // 节点变化后，重新赋值_tempId的值
  const resetTreeNodeTempId = (arr: any, _tempId: string) => {
    const result = arr.map((item: any, index: number) => {
      item['_tempId'] = _tempId + '-' + String(index);
      if (item?.children?.length > 0) {
        item.children = resetTreeNodeTempId(item.children, item._tempId);
      }
      return item;
    });
    return result;
  };

  // 根据临时生成的节点ID，删除对应节点;
  const removeNodeById = (tree: any, _tempId: string) => {
    let newTree: any = [];
    newTree = tree.filter((node: any) => {
      if (node._tempId === _tempId) {
        return false;
      }
      if (node.children && node.children.length > 0) {
        node.children = removeNodeById(node.children, _tempId);
      }
      return true;
    });
    return JSON.parse(JSON.stringify(newTree));
  };

  useEffect(() => {
    let speciesValue = {};
    if (props?.displayText != '{}' && props?.displayText != '') {
      speciesValue = JSON.parse(props.displayText);
    } else {
      speciesValue = { and: [] };
    }
    const result = resetTreeData({ ...speciesValue, isTop: true });
    if (result.length > 0) {
      setConditionData(result[0]);
    }
  }, [props.displayText]);

  // 删除节点
  const onDelete = (item: any) => {
    const newConChildren = removeNodeById(conditionData.children, item._tempId);
    const newConditionData = {
      ...conditionData,
      children: resetTreeNodeTempId(newConChildren, '1'),
    };
    setConditionData(newConditionData);
  };

  // 获取设置的值
  const getConditionValue = (arr: any) => {
    let result: any = [];
    arr.forEach((item: any) => {
      if (item.type == 'group') {
        let res = getConditionValue(item.children);
        if (res.length > 0) {
          result.push({
            [item.relation]: res,
          });
        }
      } else {
        if (item.value.length > 0) {
          result.push(item.value);
        }
      }
    });
    return result;
  };

  const getFilterConditionValue = () => {
    let value = {
      [conditionData.relation]: getConditionValue(conditionData.children),
    };
    props.onChange(value);
  };

  useEffect(() => {
    getFilterConditionValue();
  }, [conditionData]);

  return (
    <ConditionTree
      conditionData={conditionData}
      options={props.speciesTreeData}
      onDelete={(item: any) => {
        onDelete(item);
      }}
      onChange={() => {
        getFilterConditionValue();
      }}
    />
  );
};

export default FilterCondition;
