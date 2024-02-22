import React, { useEffect, useState } from 'react';
import type { MenuProps } from 'antd';
import { Select, Dropdown, Button, TreeSelect } from 'antd';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import useObjectUpdate from '@/hooks/useObjectUpdate';
import message from '@/utils/message';

import './index.less';

interface treeOptionsType {
  value: string;
  title: string;
  children?: treeOptionsType[];
}

interface conditionType {
  type: string;
  value: string[];
}

interface conditionGroupType {
  relation: string;
  type: string;
  isTop?: Boolean;
  _tempId?: string;
  children: (conditionType | conditionGroupType)[];
}

interface IProps {
  conditionData: conditionGroupType;
  options: treeOptionsType[];
  _tempId?: string;
  onDelete: Function;
  onChange: Function;
}

const ConditionTree: React.FC<IProps> = (props) => {
  const [conditionData, setConditionData] = useState(props.conditionData);
  const [key, forceUpdate] = useObjectUpdate(conditionData);

  useEffect(() => {
    setConditionData(props.conditionData);
  }, [props.conditionData]);

  const handleChange = (value: string) => {
    conditionData.relation = value;
    forceUpdate();
    props.onChange();
  };

  const getEmptyData = (type: string, _tempId: string) => {
    if (type == 'group') {
      return { relation: 'and', type: 'group', children: [], _tempId };
    } else {
      return { type: 'condition', value: [], _tempId };
    }
  };

  // const findNodeById = (tree: any, id: string) => {
  //   for (const node of tree) {
  //     if (node.value === id) {
  //       return node;
  //     }
  //     if (node.children && node.children.length > 0) {
  //       const childNode: any = findNodeById(node.children, id);
  //       if (childNode) {
  //         return childNode;
  //       }
  //     }
  //   }
  //   return null;
  // };

  const items: MenuProps['items'] = [
    {
      key: '1',
      label: (
        <Button
          type="text"
          onClick={() => {
            const _tempId =
              conditionData._tempId + '-' + String(conditionData.children.length + 1);
            conditionData.children.push(getEmptyData('condition', _tempId));
            forceUpdate();
            props.onChange();
          }}>
          添加条件
        </Button>
      ),
    },
    {
      key: '2',
      label: (
        <Button
          type="text"
          onClick={() => {
            const _tempId =
              conditionData._tempId + '-' + String(conditionData.children.length + 1);
            conditionData.children.push(getEmptyData('group', _tempId));
            forceUpdate();
            props.onChange();
          }}>
          添加组
        </Button>
      ),
    },
  ];

  if (!props.conditionData || !props.conditionData.relation) {
    return <></>;
  }

  return (
    <div className="filterCondition" key={key}>
      <div className="parentLevel">
        {!conditionData?.isTop && (
          <div className="deleteIcon">
            <Button
              type="text"
              icon={
                <CloseOutlined
                  style={{ color: '#d9534f4d' }}
                  onClick={(item) => {
                    props.onDelete(conditionData);
                    forceUpdate();
                    props.onChange();
                  }}
                />
              }
            />
          </div>
        )}
        <div className="relation">
          <Select
            defaultValue="and"
            showArrow={false}
            value={conditionData?.relation ?? 'and'}
            style={{ width: 40 }}
            onChange={handleChange}
            options={[
              { value: 'and', label: '与' },
              { value: 'or', label: '或' },
            ]}
          />
        </div>
        <div className="addIcon">
          <Dropdown menu={{ items }} placement="bottomLeft">
            <Button type="text" icon={<PlusOutlined style={{ color: '#5cb85c' }} />} />
          </Dropdown>
        </div>
      </div>
      {conditionData!.children!.length > 0 &&
        conditionData.children.map((item: any) => {
          if (item.type == 'condition') {
            return (
              <div key={item._tempId} className="children">
                <div className="deleteIcon">
                  <Button
                    type="text"
                    icon={
                      <CloseOutlined
                        style={{ color: '#d9534f4d' }}
                        onClick={() => {
                          props.onDelete(item);
                          forceUpdate();
                          props.onChange();
                        }}
                      />
                    }
                  />
                </div>
                <div className="childrenComponent">
                  <TreeSelect
                    showSearch
                    style={{ width: '100px' }}
                    dropdownMatchSelectWidth={200}
                    clearIcon={false}
                    value={item.value[0]}
                    dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                    placeholder="请选择"
                    allowClear
                    treeDefaultExpandAll
                    treeData={props.options}
                    onChange={(newValue, label, extra) => {
                      const node = extra.triggerNode.props;
                      if (node?.lookup?.dataSource.length > 0) {
                        message.warn('请选择最后一层节点');
                        return false;
                      } else {
                        item.value = [newValue];
                        forceUpdate();
                        props.onChange();
                      }
                    }}
                  />
                </div>
              </div>
            );
          }
          if (item.type == 'group') {
            return (
              <div key={item._tempId} className="children">
                <ConditionTree {...props} conditionData={item} options={props.options} />
              </div>
            );
          }
        })}
    </div>
  );
};

export default ConditionTree;
