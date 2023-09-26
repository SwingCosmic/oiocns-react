import Welfare from '@/components/PageBuilder/elements/welfare';
import { ViewerHost } from '@/components/PageBuilder/view/ViewerHost';
import FullScreenModal from '@/executor/tools/fullScreen';
import { IForm } from '@/ts/core';
import { ShareIdSet } from '@/ts/core/public/entity';
import { IPageTemplate } from '@/ts/core/thing/standard/page';
import { json } from '@codemirror/lang-json';
import CodeMirror from '@uiw/react-codemirror';
import { Button } from 'antd';
import React, { useState } from 'react';

interface IProps {
  current: IPageTemplate;
  finished: () => void;
}

const TemplateModal: React.FC<IProps> = ({ current, finished }) => {
  const [meta, setMeta] = useState(current.metadata);
  current.directory.forms;
  return (
    <FullScreenModal
      open
      centered
      fullScreen
      width={'80vw'}
      bodyHeight={'80vh'}
      destroyOnClose
      title={'页面模板配置'}
      onCancel={() => finished()}
      children={
        <>
          <Button onClick={() => setMeta(current.metadata)}>刷新</Button>
          <CodeMirror
            style={{ marginTop: 10 }}
            height={'200px'}
            value={meta.data}
            extensions={[json()]}
            onChange={(value) => {
              current.metadata.data = value;
              try {
                const children = JSON.parse(current.metadata.data);
                console.log(current.metadata.rootElement);
                current.metadata.rootElement.children.push(...children);
              } catch (error) {
                console.log(error);
              }
              current.update(current.metadata);
            }}
          />
          <ViewerHost page={meta} />
          {/* <Welfare current={form} /> */}
        </>
      }
    />
  );
};

export default TemplateModal;
