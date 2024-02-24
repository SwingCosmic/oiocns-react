import { IFinancial } from '@/ts/core';
import { json } from '@codemirror/lang-json';
import CodeMirror from '@uiw/react-codemirror';
import React, { useState } from 'react';
import { FullScreen } from '..';
import { message } from 'antd';

interface TemplateProps {
  financial: IFinancial;
  onFinished?: () => void;
  onSaved?: () => void;
  onCancel?: () => void;
}

export const DepreciationTemplate: React.FC<TemplateProps> = (props) => {
  const [data, setData] = useState<string>(
    JSON.stringify(props.financial.configuration.metadata ?? '{}', null, 4),
  );
  return (
    <FullScreen
      title={'折旧模板配置'}
      onFinished={props.onFinished}
      onCancel={props.onCancel}
      onSave={async () => {
        try {
          await props.financial.configuration.setMetadata(JSON.parse(data));
          props.onSaved?.();
        } catch (e) {
          message.error(`数据格式错误${data}`);
        }
      }}>
      <CodeMirror
        style={{ marginTop: 10 }}
        value={data}
        height={'90vh'}
        extensions={[json()]}
        onChange={(value) => {
          setData(value);
        }}
      />
    </FullScreen>
  );
};
