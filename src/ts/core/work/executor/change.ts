import { model } from '@/ts/base';
import orgCtrl from '@/ts/controller';
import { formatDate } from '@/utils';
import { Executor } from '.';

/**
 * 字段变更
 */
export class FieldsChange extends Executor {
  /**
   * 执行
   * @param data 表单数据
   */
  async execute(): Promise<boolean> {
    await this.task.loadInstance();
    const instance = this.task.instanceData;
    if (instance) {
      for (const change of this.metadata.changes) {
        for (const form of instance.node.forms) {
          if (change.id == form.id) {
            const editData: model.FormEditData[] = instance.data[change.id];
            if (editData && editData.length > 0) {
              const edit = editData[editData.length - 1];
              const afterEdit: model.FormEditData = {
                before: edit.after,
                after: edit.after.map((item) => {
                  const newData = { ...item };
                  for (const fieldChange of change.fieldChanges) {
                    newData[fieldChange.id] = fieldChange.after;
                  }
                  return newData;
                }),
                nodeId: this.task.taskdata.nodeId,
                creator: orgCtrl.user.id,
                createTime: formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss.S'),
                formName: edit.formName,
                rules: [],
              };
              editData.push(afterEdit);
            }
          }
        }
      }
    }
    return false;
  }
}
