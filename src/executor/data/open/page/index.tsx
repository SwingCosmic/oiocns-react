import HostManagerBase from '@/components/PageBuilder/render/HostManager';
import { ViewerHost } from '@/components/PageBuilder/view/ViewerHost';
import ViewerManager from '@/components/PageBuilder/view/ViewerManager';
import FullScreenModal from '@/executor/tools/fullScreen';
import { IPageTemplate } from '@/ts/core/thing/standard/page';
import React from 'react';

interface IProps {
  current: IPageTemplate;
  finished: () => void;
}

const TemplateView: React.FC<IProps> = ({ current, finished }) => {
  return (
    <FullScreenModal
      open
      centered
      fullScreen
      width={'80vw'}
      bodyHeight={'80vh'}
      destroyOnClose
      title={'页面预览'}
      onCancel={() => finished()}
      children={<ViewerHost ctx={{ view: new ViewerManager(current) }} />}
    />
  );
};

export default TemplateView;
