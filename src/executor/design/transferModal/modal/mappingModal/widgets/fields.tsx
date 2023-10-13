import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import { model } from '@/ts/base';
import { generateUuid } from '@/ts/base/common';
import { XAttribute } from '@/ts/base/schema';
import { IForm, ITransfer } from '@/ts/core';
import { ShareIdSet } from '@/ts/core/public/entity';
import { Radio, Space, Tag } from 'antd';
import React, { useEffect, useState } from 'react';
import cls from './../index.module.less';

interface IProps {
  transfer: ITransfer;
  current: model.Mapping;
  target: 'source' | 'target';
}

const getForm = (current: model.Mapping, target: 'source' | 'target') => {
  return ShareIdSet.get(current[target] + '*') as IForm | undefined;
};

const getAttrs = (current: model.Mapping, target: 'source' | 'target') => {
  const used = new Set(current.mappings.map((item) => item[target]));
  const form = getForm(current, target);
  return form?.attributes.filter((field) => !used.has(field.id)) ?? [];
};

const Fields: React.FC<IProps> = ({ transfer, current, target }) => {
  const form = getForm(current, target);
  const [attrs, setAttrs] = useState<XAttribute[]>(getAttrs(current, target));
  const [value, setValue] = useState<string>('');
  useEffect(() => {
    const id = transfer.command.subscribe((type, cmd) => {
      if (type != 'fields') return;
      switch (cmd) {
        case 'clear':
          setValue('');
          break;
        case 'refresh':
          setAttrs(getAttrs(current, target));
          break;
      }
    });
    return () => {
      transfer.command.unsubscribe(id);
    };
  });
  return (
    <div style={{ flex: 1 }} className={cls['flex-column']}>
      <EntityIcon entityId={form?.name} showName />
      <div className={cls['fields']}>
        <Radio.Group value={value} buttonStyle="outline">
          <Space direction="vertical">
            {attrs.map((item) => (
              <Radio
                key={generateUuid()}
                className={cls['field']}
                value={item.id}
                onChange={(e) => {
                  setValue(e.target.value);
                  transfer.command.emitter('fields', 'choose', [target, item]);
                }}>
                <Space>
                  <Tag color="cyan">{item.property?.valueType}</Tag>
                  {item.name + ' ' + item.property?.info}
                </Space>
              </Radio>
            ))}
          </Space>
        </Radio.Group>
      </div>
    </div>
  );
};

export default Fields;
