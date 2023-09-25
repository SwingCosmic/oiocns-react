import { IPageTemplate } from '@/ts/core/thing/standard/page';
import CodeMirror from '@uiw/react-codemirror';
import React from 'react';
import { json } from '@codemirror/lang-json';

interface IProps {
  current: IPageTemplate;
}

const Content: React.FC<IProps> = ({ current }) => {
  return (
    <CodeMirror
      value={current.metadata.data}
      height={'200px'}
      minHeight="100px"
      extensions={[json()]}
      onChange={(value) => {
        current.setContent(value);
      }}
    />
  );
};

export default Content;
