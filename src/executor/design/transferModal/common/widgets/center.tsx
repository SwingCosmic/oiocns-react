import { model } from '@/ts/base';
import { generateUuid } from '@/ts/base/common';
import { ITransfer } from '@/ts/core';
import { ShareIdSet } from '@/ts/core/public/entity';
import { message } from 'antd';
import React, { ReactNode, useEffect, useState } from 'react';
import {
  InputModal,
  MappingModal,
  RequestModal,
  SelectionModal,
  StoreModal,
  TransferRunning,
} from '../..';
import OfficeView from '@/executor/open/office';
import LabelsModal from '@/executor/design/labelsModal';

interface IProps {
  current: ITransfer;
}

export const Center: React.FC<IProps> = ({ current }) => {
  const [center, setCenter] = useState<ReactNode>();
  const setEmpty = () => setCenter(<></>);
  useEffect(() => {
    const id = current.command.subscribe(async (type, cmd, args) => {
      switch (type) {
        case 'tools':
          switch (cmd) {
            case 'edit':
              switch (args.typeName) {
                case '请求':
                  setCenter(
                    <RequestModal
                      key={generateUuid()}
                      finished={setEmpty}
                      transfer={current}
                      current={args}
                    />,
                  );
                  break;
                case '映射':
                  setCenter(
                    <MappingModal
                      key={generateUuid()}
                      finished={setEmpty}
                      transfer={current}
                      current={args}
                    />,
                  );
                  break;
                case '存储':
                  setCenter(
                    <StoreModal
                      key={generateUuid()}
                      finished={setEmpty}
                      transfer={current}
                      current={args}
                    />,
                  );
                  break;
                case '子图':
                  setCenter(
                    <TransferRunning
                      key={generateUuid()}
                      current={current.getTransfer(args.nextId)!}
                      finished={setEmpty}
                    />,
                  );
                  break;
                case '表格':
                  {
                    const tables = args as model.Tables;
                    if (tables.file) {
                      setCenter(
                        <OfficeView
                          key={generateUuid()}
                          share={tables.file}
                          finished={setEmpty}
                        />,
                      );
                    } else {
                      message.error('未上传文件');
                    }
                  }
                  break;
                case '表单':
                  {
                    const formNode = args as model.Form;
                    const form = ShareIdSet.get(formNode.formId + '*');
                    if (form) {
                      setCenter(
                        <LabelsModal
                          key={generateUuid()}
                          current={form}
                          finished={setEmpty}
                        />,
                      );
                    } else {
                      message.error('未绑定表单');
                    }
                  }
                  break;
              }
              break;
            case 'open':
              break;
          }
          break;
        case 'data':
          {
            switch (cmd) {
              case 'input':
                {
                  const { form, formNode } = args;
                  setCenter(
                    <InputModal
                      key={generateUuid()}
                      current={form}
                      finished={(value) => {
                        setEmpty();
                        current.command.emitter('data', 'inputCall', { value, formNode });
                      }}
                    />,
                  );
                }
                break;
              case 'selection':
                {
                  const { form, data, selectionNode } = args;
                  setCenter(
                    <SelectionModal
                      key={generateUuid()}
                      form={form}
                      data={data}
                      node={selectionNode}
                      finished={(value) =>
                        current.command.emitter('data', 'selectionCall', {
                          value,
                          selectionNode,
                        })
                      }
                    />,
                  );
                }
                break;
              case 'reading':
                {
                  // const table = args as model.Tables;
                  // if (table.file) {
                  //   const url = `/orginone/kernel/load/${table.file.shareLink}?download=1`;
                  //   const res = await axios.request({
                  //     method: 'GET',
                  //     url: url,
                  //     responseType: 'blob',
                  //   });
                  //   const sheets = await this.template<any>(node);
                  //   readXlsx(res.data as Blob, sheets);
                  // }
                }
                break;
            }
          }
          break;
      }
    });
    return () => {
      current.command.unsubscribe(id);
    };
  });
  return <>{center}</>;
};
