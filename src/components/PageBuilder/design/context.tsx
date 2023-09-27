import { IPageTemplate } from '@/ts/core/thing/standard/page';
import { json } from '@codemirror/lang-json';
import CodeMirror from '@uiw/react-codemirror';
import React from 'react';

interface IProps {
  current: IPageTemplate;
  onChange: (content: string) => void;
}

const Coder: React.FC<IProps> = ({ current, onChange }) => {
  return (
    <CodeMirror
      style={{ marginTop: 10 }}
      height={'200px'}
      value={current.metadata.data}
      extensions={[json()]}
      onChange={onChange}
    />
  );
};

export default Coder;
