import { kernel, model } from '@/ts/base';
import { getNodeByNodeId } from '@/utils/tools';
import { Executor, FormData } from '.';
import { formatDate } from '@/ts/base/common';

// 数据领用
export class Acquire extends Executor {
  async execute(data: FormData): Promise<Map<string, model.FormEditData>> {
    await this.task.loadInstance();
    if (!this.task.instanceData) {
      return data;
    }
    const node = getNodeByNodeId(this.task.taskdata.nodeId, this.task.instanceData.node);
    if (!node?.detailForms) {
      return data;
    }
    for (const form of node.detailForms) {
      let take = 500;
      let skip = 0;
      let formEditData: model.FormEditData = {
        before: [],
        after: [],
        nodeId: this.task.taskdata.nodeId,
        formName: form.name,
        creator: this.task.userId,
        createTime: formatDate(new Date(), 'yyyy-MM-dd hh:mm:ss.S'),
      };
      while (true) {
        const loadOptions = {
          take: take,
          skip: skip,
          requireTotalCount: true,
          userData: [`F${form.id}`],
          filter: ['belongId', '=', this.task.taskdata.applyId],
        };
        const things = await kernel.loadThing(
          form.belongId,
          [form.belongId],
          loadOptions,
        );
        formEditData.after.push(...things.data);
        skip += things.data.length;
        if (things.data.length == 0) {
          break;
        }
      }
      data.set(form.id, formEditData);
    }
    return data;
  }
}
