import OpenFileDialog from '@/components/OpenFileDialog';
import { schema } from '@/ts/base';
import orgCtrl from '@/ts/controller';
import { Input } from 'antd';
import React, { useContext, useEffect, useState } from 'react';
import { PageContext } from '../../../render/PageContext';
import { IExistTypeProps } from '../IExistTypeEditor';
import { IFile } from '@/ts/core';

interface BaseProps {
  showName?: string;
  onSelected: (file: IFile[]) => void;
  accepts: string[];
}

function Base({ accepts, onSelected, showName }: BaseProps) {
  const ctx = useContext(PageContext);
  const [center, setCenter] = useState(<></>);
  const open = () => {
    setCenter(
      <OpenFileDialog
        accepts={accepts}
        rootKey={ctx.view.pageInfo.directory.spaceKey}
        multiple={false}
        onOk={(files) => {
          if (files.length > 0) {
            onSelected(files);
          }
          setCenter(<></>);
        }}
        onCancel={() => setCenter(<></>)}
      />,
    );
  };
  return (
    <>
      <Input value={showName} onClick={open} />
      {center}
    </>
  );
}

interface IProps extends IExistTypeProps<string> {
  accepts: string[];
}

const Entity: React.FC<IProps> = ({ accepts, value, onChange }) => {
  const ctx = useContext(PageContext);
  const [entity, setEntity] = useState<schema.XEntity>();
  const loadEntity = async () => {
    if (!value) return;
    const collLoad = async (coll: 'formColl' | 'propertyColl') => {
      const entities = await ctx.view.pageInfo.directory.resource[coll].find([value]);
      if (entities.length > 0) {
        setEntity(entities[0]);
      }
      return entities.length > 0;
    };
    for (const accept of accepts) {
      switch (accept) {
        case '实体配置':
        case '事项配置':
          if (await collLoad('formColl')) {
            return;
          }
          break;
        case '属性配置':
          if (await collLoad('propertyColl')) {
            return;
          }
          break;
        case '办事':
          {
            for (const app of await orgCtrl.loadApplications()) {
              for (const work of await app.loadWorks()) {
                if (work.id == value) {
                  setEntity(work.metadata);
                }
              }
            }
          }
          break;
      }
    }
  };
  useEffect(() => {
    loadEntity();
  }, []);
  return (
    <Base
      showName={entity?.name}
      onSelected={(file) => {
        onChange(file[0].id);
      }}
      accepts={accepts}
    />
  );
};

export const FormFile: React.FC<IExistTypeProps<string>> = (props) => {
  return <Entity {...props} accepts={['实体配置', '事项配置']} />;
};

export const WorkFile: React.FC<IExistTypeProps<string>> = (props) => {
  return <Entity {...props} accepts={['办事']} />;
};

export const PicFile: React.FC<IExistTypeProps<schema.XEntity>> = (props) => {
  return (
    <Base
      showName={props.value?.name}
      onSelected={(file: IFile[]) => {
        props.onChange(file[0].metadata);
      }}
      accepts={['图片']}
    />
  );
};

export const PropFile: React.FC<IExistTypeProps<string>> = (props) => {
  return <Entity {...props} accepts={['属性']} />;
};

export default Entity;
