import OpenFileDialog from '@/components/OpenFileDialog';
import { schema } from '@/ts/base';
import { Button, Space } from 'antd';
import React, { CSSProperties, useState } from 'react';
import { ExistTypeMeta } from '../../../core/ElementMeta';
import { Context } from '../../../render/PageContext';
import { defineElement } from '../../defineElement';
interface IProps {
  height: number;
  url?: schema.XEntity;
  props: any;
  ctx: Context;
}

const style = (height: number, url?: string) => {
  return {
    position: 'relative',
    backgroundImage: `url(${url})`,
    backgroundRepeat: 'no-repeat',
    backgroundColor: '#fafafa',
    backgroundPosition: 'center',
    backgroundSize: 'cover',
    height: height,
  } as CSSProperties;
};

const View: React.FC<IProps> = (props) => {
  return <div style={style(props.height, props.url?.id)} />;
};

const Design: React.FC<IProps> = (props) => {
  const [center, setCenter] = useState(<></>);
  const [url, setUrl] = useState(props.url?.id);
  return (
    <div style={style(props.height, url)}>
      <Space style={{ position: 'absolute', left: 10, bottom: 10 }}>
        <Button
          type="dashed"
          size="small"
          onClick={() => {
            setCenter(
              <OpenFileDialog
                accepts={['图片']}
                rootKey={props.ctx.view.pageInfo.directory.spaceKey}
                multiple={false}
                onOk={(files) => {
                  if (files.length > 0) {
                    props.props.url = files[0].metadata;
                    setUrl(props.props.url.id);
                  }
                  setCenter(<></>);
                }}
                onCancel={() => setCenter(<></>)}
              />,
            );
          }}>
          添加图片
        </Button>
      </Space>
      {center}
    </div>
  );
};

export default defineElement({
  render(props, ctx) {
    if (ctx.view.mode == 'design') {
      return <Design {...props} ctx={ctx} />;
    }
    return <View {...props} ctx={ctx} />;
  },
  displayName: 'HeadBanner',
  meta: {
    props: {
      height: {
        type: 'number',
        default: 200,
      },
      url: {
        type: 'type',
        label: '关联图片',
        typeName: 'picFile',
      } as ExistTypeMeta<schema.XEntity | undefined>,
    },
    label: '横幅',
    type: 'Element',
  },
});
