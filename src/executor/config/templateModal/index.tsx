import { DesignerHost } from '@/components/PageBuilder/design/DesignerHost';
import DesignerManager from '@/components/PageBuilder/design/DesignerManager';
import FullScreenModal from '@/executor/tools/fullScreen';
import { IPageTemplate } from '@/ts/core/thing/standard/page';
import React from 'react';

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
      title={'页面配置'}
      onCancel={() => finished()}
      children={<DesignerHost ctx={{ view: new DesignerManager(current) }} />}
    />
  );
};

export default TemplateModal;
