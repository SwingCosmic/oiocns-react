import { command, kernel, model } from '@/ts/base';
import { sleep } from '@/ts/base/common';
import { IBelong, IDirectory } from '@/ts/core';
import { formatDate } from '@/utils';
import * as el from '@/utils/excel';
import { ProTable } from '@ant-design/pro-components';
import { Button, Modal, Progress, Space, Spin, Tabs, Upload, message } from 'antd';
import React, { useEffect, useRef, useState } from 'react';

/** 上传业务导入模板 */
export const uploadBusiness = (dir: IDirectory) => {
  initialize('业务模板', dir, el.getBusinessSheets(dir.target.directory));
};

/** 上传标准导入模板 */
export const uploadStandard = (dir: IDirectory) => {
  initialize('标准模板', dir, el.getStandardSheets(dir.target.directory));
};

export const initialize = (
  templateName: string,
  dir: IDirectory,
  sheets: el.ISheetHandler<any>[],
) => {
  dir = dir.target.directory;
  const excel = new el.Excel(sheets);
  const modal = Modal.info({
    icon: <></>,
    okText: '关闭',
    width: 610,
    title: '导入' + templateName,
    maskClosable: true,
    content: (
      <Progressing
        dir={dir}
        excel={excel}
        finished={() => {
          modal.destroy();
          openUploader(templateName, dir, excel);
        }}
      />
    ),
  });
};

interface ProgressingProps {
  dir: IDirectory;
  excel: el.IExcel;
  finished: () => void;
}

export const Progressing = ({ dir, excel, finished }: ProgressingProps) => {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    excel.context.initialize(dir, setProgress).then(async () => {
      await sleep(500);
      finished();
    });
  }, []);
  return (
    <div style={{ marginTop: 20 }}>
      <Progress percent={progress} showInfo={false} />
      <span>正在初始化数据中...</span>
    </div>
  );
};

export function openUploader(templateName: string, dir: IDirectory, excel: el.IExcel) {
  const modal = Modal.info({
    icon: <></>,
    okText: '关闭',
    width: 610,
    title: '导入模板',
    maskClosable: true,
    content: (
      <Uploader
        templateName={templateName}
        excel={excel}
        finished={(file: File) => {
          modal.destroy();
          showData(
            excel,
            (modal) => {
              modal.destroy();
              generate(dir, file.name, excel);
            },
            '开始导入',
          );
        }}
      />
    ),
  });
}

interface IProps {
  templateName: string;
  excel: el.IExcel;
  finished: (file: File) => void;
}

export const Uploader: React.FC<IProps> = ({ templateName, excel, finished }) => {
  const [loading, setLoading] = useState(false);
  return (
    <Space direction="vertical">
      <div style={{ marginTop: 20 }}>
        <Button onClick={async () => el.generateXlsx(excel, templateName)}>
          {templateName}下载
        </Button>
      </div>
      <Spin spinning={loading}>
        <Upload
          type={'drag'}
          showUploadList={false}
          accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          style={{ width: 550, height: 300, marginTop: 20 }}
          customRequest={async (options) => {
            setLoading(true);
            await el.readXlsx(options.file as Blob, excel);
            setLoading(false);
            finished(options.file as File);
          }}>
          <div style={{ color: 'limegreen', fontSize: 22 }}>点击或拖拽至此处上传</div>
        </Upload>
      </Spin>
    </Space>
  );
};

/** 展示数据 */
const showData = (excel: el.IExcel, confirm: (modal: any) => void, okText: string) => {
  const modal = Modal.info({
    icon: <></>,
    okText: okText,
    onOk: () => confirm(modal),
    width: 1344,
    title: '数据',
    maskClosable: true,
    content: (
      <Tabs
        items={excel.handlers.map((item) => {
          return {
            label: item.sheet.name,
            key: item.sheet.name,
            children: (
              <ProTable
                key={item.sheet.name}
                dataSource={item.sheet.data}
                cardProps={{ bodyStyle: { padding: 0 } }}
                scroll={{ y: 400 }}
                options={false}
                search={false}
                columns={[
                  {
                    title: '序号',
                    valueType: 'index',
                    width: 50,
                  },
                  ...item.sheet.columns,
                ]}
              />
            ),
          };
        })}
      />
    ),
  });
};

/** 开始导入 */
const generate = async (dir: IDirectory, name: string, excel: el.IExcel) => {
  let errors = excel.handlers.flatMap((item) => item.checkData(excel));
  if (errors.length > 0) {
    showErrors(errors);
    return;
  }
  command.emitter('executor', 'taskList', dir);
  const task: model.TaskModel = {
    name: name,
    size: 0,
    finished: 0,
    createTime: new Date(),
  };
  dir.taskList.push(task);
  excel.dataHandler = {
    initialize: (totalRows) => {
      task.size = totalRows;
      dir.taskEmitter.changCallback();
    },
    onItemCompleted: () => {
      task.finished += 1;
      dir.taskEmitter.changCallback();
    },
    onCompleted: () => {
      task.finished = task.size;
      dir.taskEmitter.changCallback();
      message.success(`模板导入成功！`);
      showData(
        excel,
        (modal) => {
          modal.destroy();
          let fileName = `数据导入模板(${formatDate(new Date(), 'yyyy-MM-dd HH:mm')})`;
          el.generateXlsx(excel, fileName);
        },
        '生成数据模板',
      );
      const dirSheet = excel.handlers.find((item) => item.sheet.name == '目录');
      if (dirSheet) {
        dir.notify('reload', { ...dir.metadata, directoryId: dir.id });
      }
    },
    onReadError: (errors) => {
      showErrors(errors);
    },
  };
  excel.handling();
};

/** 错误数据 */
const showErrors = (errors: el.Error[]) => {
  Modal.info({
    icon: <></>,
    okText: '关闭',
    width: 1000,
    title: '错误信息',
    maskClosable: true,
    content: (
      <ProTable
        dataSource={errors}
        cardProps={{ bodyStyle: { padding: 0 } }}
        scroll={{ y: 500 }}
        options={false}
        search={false}
        columns={[
          {
            title: '序号',
            valueType: 'index',
            width: 50,
          },
          {
            title: '表名',
            dataIndex: 'name',
          },
          {
            title: '行数',
            dataIndex: 'row',
            render: (_: any, data: el.Error) => {
              if (typeof data.row == 'number') {
                return <>{data.row}</>;
              }
              return <>{data.row.join(',')}</>;
            },
          },
          {
            title: '错误信息',
            dataIndex: 'message',
            width: 460,
          },
        ]}
      />
    ),
  });
};

export const generating = (
  belong: IBelong,
  formName: string,
  data: el.schema.XThing[],
  formData: model.FormEditData,
  finished: () => void,
) => {
  const Progressing = () => {
    const counting = useRef(0);
    const [progress, setProgress] = useState(0);
    useEffect(() => {
      createThings(data, () => {
        counting.current += 1;
        setProgress((counting.current * 100) / data.length);
      }).then(() => {
        modal.destroy();
        finished();
      });
    }, []);
    return (
      <div style={{ marginTop: 20 }}>
        <Progress percent={progress} showInfo={false} />
        <span>正在生成数据中...</span>
      </div>
    );
  };
  const createThings = async (data: el.schema.XThing[], onAdd: () => void) => {
    for (const item of data) {
      const thing = await kernel.createThing(belong.id, [belong.id], formName);
      if (thing.success) {
        const merge = { ...item, ...thing.data };
        formData.before.push(merge);
        formData.after.push(merge);
      }
      onAdd();
    }
  };
  const modal = Modal.info({
    icon: <></>,
    okText: '关闭',
    width: 610,
    title: '导入数据中',
    maskClosable: true,
    content: <Progressing />,
  });
};
