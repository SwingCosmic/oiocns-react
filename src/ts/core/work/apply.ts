import { kernel, model, schema } from '../../base';
import { XCollection } from '../public/collection';
import { IBelong } from '../target/base/belong';
import { IForm } from '../thing/standard/form';
export interface IWorkApply {
  /** 主表 */
  primaryForms: IForm[];
  /** 子表 */
  detailForms: IForm[];
  /** 发起样式类型 */
  applyType: string;
  /** 办事空间 */
  belong: IBelong;
  /** 元数据 */
  metadata: model.WorkInstanceModel;
  /** 实例携带的数据 */
  instanceData: model.InstanceDataModel;
  /** 校验表单数据 */
  validation(): boolean;
  /** 发起申请 */
  createApply(
    applyId: string,
    content: string,
    gateways: Map<string, string>,
  ): Promise<boolean>;
  /** 暂存申请 */
  staggingApply(
    content: string,
    gateways: Map<string, string>,
    collection: XCollection<schema.XWorkInstance>,
    id?: string,
  ): Promise<schema.XWorkInstance | undefined>;
}

export class WorkApply implements IWorkApply {
  constructor(
    _metadata: model.WorkInstanceModel,
    _data: model.InstanceDataModel,
    _belong: IBelong,
    _primaryForms: IForm[],
    _detailForms: IForm[],
    _applyType: string,
  ) {
    this.primaryForms = _primaryForms;
    this.detailForms = _detailForms;
    this.metadata = _metadata;
    this.instanceData = _data;
    this.applyType = _applyType ?? '';
    this.belong = _belong;
  }
  primaryForms: IForm[];
  detailForms: IForm[];
  applyType: string;
  belong: IBelong;
  metadata: model.WorkInstanceModel;
  instanceData: model.InstanceDataModel;
  validation(): boolean {
    const valueIsNull = (value: any) => {
      return (
        value === null ||
        value === undefined ||
        (typeof value === 'string' && (value == '[]' || value.length < 1))
      );
    };
    const hides = this.getHideForms();
    for (const formId of Object.keys(this.instanceData.fields).filter(
      (a) => !hides.includes(a),
    )) {
      const formData = this.instanceData.data[formId]?.at(-1);
      const data: any = formData?.after.at(-1) ?? {};
      for (const item of this.instanceData.fields[formId]) {
        var isRequired = item.options?.isRequired;
        if (formData?.rules && Array.isArray(formData?.rules)) {
          const rules = formData?.rules.filter((a) => a.destId == item.id);
          if (rules) {
            for (const rule of rules) {
              if (rule.typeName == 'isRequired') {
                isRequired = isRequired && rule.value;
              }
              if (rule.typeName == 'visible') {
                isRequired = isRequired && rule.value;
              }
            }
          }
        }
        if (isRequired && valueIsNull(data[item.id])) {
          return false;
        }
      }
    }
    return true;
  }
  async createApply(
    applyId: string,
    content: string,
    gateways: Map<string, string>,
  ): Promise<boolean> {
    var gatewayInfos: model.WorkGatewayInfoModel[] = [];
    gateways.forEach((v, k) => {
      gatewayInfos.push({
        nodeId: k,
        targetId: v,
      });
    });
    const hideFormIds = this.getHideForms();
    var mark = await this.getMarkInfo(hideFormIds);
    if (content.length > 0) {
      mark += `备注:${content}`;
    }
    hideFormIds.forEach((a) => {
      delete this.instanceData.data[a];
      delete this.instanceData.fields[a];
    });
    const res = await kernel.createWorkInstance({
      ...this.metadata,
      applyId: applyId,
      content: mark,
      contentType: 'Text',
      data: JSON.stringify(this.instanceData),
      gateways: JSON.stringify(gatewayInfos),
    });
    return res.success;
  }
  async staggingApply(
    content: string,
    gateways: Map<string, string>,
    collection: XCollection<schema.XWorkInstance>,
    id: string = 'snowId()',
  ): Promise<schema.XWorkInstance | undefined> {
    var gatewayInfos: model.WorkGatewayInfoModel[] = [];
    gateways.forEach((v, k) => {
      gatewayInfos.push({
        nodeId: k,
        targetId: v,
      });
    });
    const hideFormIds = this.getHideForms();
    hideFormIds.forEach((a) => {
      delete this.instanceData.data[a];
      delete this.instanceData.fields[a];
    });
    const res = await collection.replace({
      ...this.metadata,
      id: id,
      contentType: 'Text',
      remark: content,
      data: JSON.stringify(this.instanceData),
      gateways: JSON.stringify(gatewayInfos),
    } as schema.XWorkInstance);
    return res;
  }
  private getHideForms = () => {
    return this.instanceData.rules
      .filter((a) => a.typeName == 'visable' && !a.value && a.formId == a.destId)
      .map((a) => a.destId);
  };
  async getMarkInfo(hideFormIds: string[]): Promise<string> {
    const remarks: string[] = [];
    for (const primaryForm of this.instanceData.node.primaryForms.filter(
      (a) => !hideFormIds.includes(a.id),
    )) {
      const key = primaryForm.id;
      const data = this.instanceData.data[key];
      const fields = this.instanceData.fields[key];
      if (data && fields) {
        for (const field of fields.filter((a) => a.options && a.options.showToRemark)) {
          var value = data.at(-1)?.after[0][field.id];
          if (value) {
            switch (field.valueType) {
              case '用户型':
                value = (await this.belong.user.findEntityAsync(value))?.name;
                break;
              case '选择型':
                value = field.lookups?.find(
                  (a) => a.id === (value as string).substring(1),
                )?.text;
                break;
              default:
                break;
            }
          }
          remarks.push(`${field.name}:${value}  `);
        }
      }
    }
    return remarks.join('');
  }
}
