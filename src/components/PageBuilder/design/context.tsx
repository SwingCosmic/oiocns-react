import { IPageTemplate } from '@/ts/core/thing/standard/page';
import { json } from '@codemirror/lang-json';
import CodeMirror from '@uiw/react-codemirror';
import React from 'react';

interface IProps {
  current: IPageTemplate;
}

const Coder: React.FC<IProps> = ({ current }) => {
  return (
    <CodeMirror
      style={{ marginTop: 10 }}
      height={'200px'}
      value={current.metadata.data}
      extensions={[json()]}
      onChange={(value) => {
        current.metadata.data = value;
        try {
          const children = JSON.parse(current.metadata.data);
          current.metadata.rootElement.children = children;
        } catch (error) {
          console.log(error);
        }
        current.update(current.metadata);
      }}
    />
  );
};

export default Coder;
