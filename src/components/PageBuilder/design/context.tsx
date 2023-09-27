import { json } from '@codemirror/lang-json';
import CodeMirror from '@uiw/react-codemirror';
import React from 'react';

interface IProps {
  current: string;
  onChange: (content: string) => void;
}

const Coder: React.FC<IProps> = ({ current, onChange }) => {
  return (
    <CodeMirror
      style={{ marginTop: 10 }}
      width={'250px'}
      height={'400px'}
      value={current}
      extensions={[json()]}
      onChange={onChange}
    />
  );
};

export default Coder;
