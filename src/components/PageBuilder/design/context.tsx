import { json } from '@codemirror/lang-json';
import CodeMirror from '@uiw/react-codemirror';
import { Button, message } from 'antd';
import React, { useContext, useState } from 'react';
import { DesignContext, PageContext } from '../render/PageContext';

interface IProps {}

const Coder: React.FC<IProps> = () => {
  const ctx = useContext<DesignContext>(PageContext as any);
  const [data, setData] = useState<string>(
    JSON.stringify(ctx.view.rootChildren, null, 2),
  );
  return (
    <>
      <Button
        onClick={() => {
          try {
            const children = JSON.parse(data);
            ctx.view.rootChildren = children;
          } catch (error) {
            message.error('JSON 格式错误！');
          }
        }}>
        刷新
      </Button>
      <CodeMirror
        style={{ marginTop: 10 }}
        width={'250px'}
        height={'400px'}
        value={data}
        extensions={[json()]}
        onChange={setData}
      />
    </>
  );
};

export default Coder;
