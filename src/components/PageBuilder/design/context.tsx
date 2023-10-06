import { json } from '@codemirror/lang-json';
import CodeMirror from '@uiw/react-codemirror';
import { Button, message } from 'antd';
import React, { useContext, useEffect, useState } from 'react';
import { DesignContext, PageContext } from '../render/PageContext';

interface IProps {}

const Coder: React.FC<IProps> = ({}) => {
  const ctx = useContext<DesignContext>(PageContext as any);
  const [data, setData] = useState<string>(
    JSON.stringify(ctx.view.rootChildren, null, 2),
  );
  useEffect(() => {
    const id = ctx.view.pageInfo.subscribe(() => {
      setData(JSON.stringify(ctx.view.rootChildren, null, 2));
    });
    return () => {
      ctx.view.pageInfo.unsubscribe(id);
    }
  });
  return (
    <div>
      <Button
        onClick={() => {
          try {
            const children = JSON.parse(data);
            ctx.view.rootChildren = children;
          } catch (error) {
            message.error('JSON 格式错误！');
          }
        }}>
        应用
      </Button>
      <CodeMirror
        style={{ marginTop: 10 }}
        width={'100%'}
        height={'70vh'}
        value={data}
        extensions={[json()]}
        onChange={setData}
      />
    </div>
  );
};

export default Coder;
