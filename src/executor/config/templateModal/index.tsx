import FullScreenModal from '@/executor/tools/fullScreen';
import { IPageTemplate } from '@/ts/core/thing/standard/page';
import React from 'react';
import Content from './widgets/content';

interface IProps {
  current: IPageTemplate;
  finished: () => void;
}

const TemplateModal: React.FC<IProps> = ({ current, finished }) => {
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
      children={<Content current={current} />}
    />
  );
};

export default TemplateModal;
