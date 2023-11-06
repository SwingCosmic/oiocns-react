import React, { useRef, useState } from 'react';
import FullScreenModal from '@/components/Common/fullScreen';
import { IForm } from '@/ts/core';
import * as config from './config';
import EntityIcon from '@/components/Common/GlobalComps/entityIcon';
import MainLayout from '@/components/MainLayout';
import useMenuUpdate from '@/hooks/useMenuUpdate';
import WorkForm from '@/components/DataStandard/WorkForm';
import GenerateThingTable from '@/executor/tools/generate/thingTable';
import CustomStore from 'devextreme/data/custom_store';
import { kernel, schema } from '@/ts/base';
import { ImCopy, ImShuffle, ImTicket } from '@/icons/im';
import { Controller } from '@/ts/controller';
import { Spin, message } from 'antd';
import ThingView from './detail';
import useAsyncLoad from '@/hooks/useAsyncLoad';
import OpenFileDialog from '@/components/OpenFileDialog';
import { ViewerHost } from '../page/view/ViewerHost';
import ViewerManager from '../page/view/ViewerManager';
import { IPageTemplate } from '@/ts/core/thing/standard/page';

interface IProps {
  form: IForm;
  finished: () => void;
}

/** 表单查看 */
const FormView: React.FC<IProps> = ({ form, finished }) => {
  const [select, setSelcet] = useState();
  const [loaded] = useAsyncLoad(() => form.loadContent());
  const selection = useRef<schema.XThing[]>([]);
  const FormBrower: React.FC = () => {
    const [center, setCenter] = useState(<></>);
    const [, rootMenu, selectMenu, setSelectMenu] = useMenuUpdate(
      () => config.loadSpeciesItemMenu(form),
      new Controller(form.key),
    );
    if (!selectMenu || !rootMenu) return <></>;
    const loadContent = () => {
      if (select) {
        return (
          <ThingView form={form} thingData={select} onBack={() => setSelcet(undefined)} />
        );
      }
      return (
        <GenerateThingTable
          key={form.key}
          height={'100%'}
          fields={form.fields}
          dataIndex="property"
          onRowDblClick={(e: any) => setSelcet(e.data)}
          selection={
            form.metadata.allowPrint
              ? {
                  mode: 'multiple',
                  allowSelectAll: true,
                  selectAllMode: 'page',
                  showCheckBoxesMode: 'always',
                }
              : {}
          }
          onSelectionChanged={(e) => {
            selection.current = e.selectedRowsData;
          }}
          dataSource={
            new CustomStore({
              key: 'id',
              async load(loadOptions) {
                loadOptions.userData = [`F${form.id}`];
                if (selectMenu.item?.value) {
                  loadOptions.userData.push(selectMenu.item.value);
                } else if (selectMenu.item?.code) {
                  loadOptions.userData.push(selectMenu.item.code);
                }
                const result = await kernel.loadThing(
                  form.belongId,
                  [form.belongId],
                  loadOptions,
                );
                return result;
              },
            })
          }
          remoteOperations={true}
          toolbar={{
            visible: true,
            items: [
              {
                name: 'print',
                location: 'after',
                widget: 'dxButton',
                options: {
                  text: '打印',
                  icon: 'add',
                  onClick: () => {
                    setCenter(
                      <OpenFileDialog
                        accepts={['页面模板']}
                        rootKey={form.directory.target.directory.spaceKey}
                        onOk={(files) => {
                          if (files.length == 0) {
                            setCenter(<></>);
                            return;
                          }
                          const page = files[0] as IPageTemplate;
                          setCenter(
                            <FullScreenModal
                              open
                              centered
                              destroyOnClose
                              width={'80vw'}
                              bodyHeight={'80vh'}
                              title={'卡片模板'}
                              onCancel={() => setCenter(<></>)}>
                              <ViewerHost
                                ctx={{
                                  view: new ViewerManager(page),
                                  data: { things: selection.current },
                                }}
                              />
                            </FullScreenModal>,
                          );
                        }}
                        onCancel={() => setCenter(<></>)}
                      />,
                    );
                  },
                },
                visible: form.metadata.allowPrint ?? false,
              },
              {
                name: 'columnChooserButton',
                location: 'after',
              },
              {
                name: 'searchPanel',
                location: 'after',
              },
            ],
          }}
          dataMenus={{
            items: [
              {
                key: 'createNFT',
                label: '生成存证',
                icon: <ImTicket fontSize={22} color={'#9498df'} />,
                onClick: () => {
                  message.success('存证成功!');
                },
              },
              {
                key: 'copyBoard',
                label: '复制数据',
                icon: <ImCopy fontSize={22} color={'#9498df'} />,
              },
              {
                key: 'startWork',
                label: '发起办事',
                icon: <ImShuffle fontSize={22} color={'#9498df'} />,
              },
            ],
            onMenuClick(key, data) {
              console.log(key, data);
            },
          }}
        />
      );
    };
    return (
      <MainLayout
        notExitIcon
        leftShow
        rightShow={false}
        selectMenu={selectMenu}
        onSelect={(data) => {
          setSelectMenu(data);
        }}
        siderMenuData={rootMenu}>
        {loadContent()}
        {center}
      </MainLayout>
    );
  };
  return (
    <FullScreenModal
      centered
      open={true}
      fullScreen
      width={'80vw'}
      title={form.name}
      bodyHeight={'80vh'}
      icon={<EntityIcon entityId={form.id} />}
      destroyOnClose
      onCancel={() => finished()}>
      {loaded ? (
        form.canDesign ? (
          <FormBrower />
        ) : (
          <WorkForm form={form} />
        )
      ) : (
        <Spin tip={'配置信息加载中...'}>
          <div style={{ width: '100%', height: '100%' }}></div>
        </Spin>
      )}
    </FullScreenModal>
  );
};

export default FormView;
