/* eslint-disable no-unused-vars */
import { Command, common, kernel, model } from '../../../../base';
import { IDirectory } from '../../directory';
import { IStandardFileInfo, StandardFileInfo } from '../../fileinfo';
import { Application, IApplication } from '../application';
import { Form, IForm } from '../form';
import { ITask, Task } from './task';
import { IWork } from '../../../work';

export interface ITransfer extends IStandardFileInfo<model.Transfer> {
  /** 触发器 */
  command: Command;
  /** 节点 */
  nodes: model.Node[];
  /** 边 */
  edges: model.Edge[];
  /** 环境 */
  envs: model.Environment[];
  /** 任务记录 */
  taskList: ITask[];
  /** 当前环境 */
  curEnv?: model.Environment;
  /** 当前任务 */
  curTask?: ITask;
  /** 关联的表单 */
  forms: { [id: string]: IForm };
  /** 关联的迁移配置 */
  transfers: { [id: string]: ITransfer };
  /** 关联的应用 */
  applications: { [id: string]: IApplication };
  /** 关联的办事配置 */
  works: { [id: string]: IWork };
  /** 取图数据 */
  getData?: () => any;
  /** 是否有环 */
  hasLoop(): boolean;
  /** 初始化 */
  initializing(): Promise<boolean>;
  /** 请求 */
  request(request: model.Request, env?: model.KeyValue): Promise<boolean>;
  /** 脚本 */
  running(code: string, args: any, env?: model.KeyValue): any;
  /** 模板 */
  template<T>(forms: IForm[]): model.Sheet<T>[];
  /** 创建任务 */
  execute(
    status: model.GStatus,
    event: model.GEvent,
    task?: ITask,
    data?: any,
  ): Promise<void>;
}

export class Transfer extends StandardFileInfo<model.Transfer> implements ITransfer {
  constructor(metadata: model.Transfer, dir: IDirectory) {
    super(metadata, dir, dir.resource.transferColl);
    this.taskList = [];
    this.forms = {};
    this.transfers = {};
    this.applications = {};
    this.works = {};
    this.canDesign = true;
    this.command = new Command();
  }

  command: Command;
  taskList: ITask[];
  forms: { [id: string]: IForm };
  transfers: { [id: string]: ITransfer };
  applications: { [id: string]: IApplication };
  works: { [id: string]: IWork };
  curTask?: ITask;
  getData?: () => any;

  get nodes() {
    return this.metadata.nodes;
  }

  get edges() {
    return this.metadata.edges;
  }

  get envs() {
    return this.metadata.envs;
  }

  get curEnv() {
    return this.envs.find((item) => item.id == this.metadata.curEnv);
  }

  get cacheFlag(): string {
    return 'transfers';
  }

  async copy(destination: IDirectory): Promise<boolean> {
    if (this.allowCopy(destination)) {
      return await super.copyTo(destination.id, destination.resource.transferColl);
    }
    return false;
  }

  async move(destination: IDirectory): Promise<boolean> {
    if (this.allowCopy(destination)) {
      return await super.copyTo(destination.id, destination.resource.transferColl);
    }
    return false;
  }

  async loadForms(formIds?: (string | undefined)[]) {
    const forms: string[] = [];
    formIds?.forEach((item) => {
      if (item && !this.forms[item]) {
        forms.push(item);
      }
    });
    if (forms.length > 0) {
      const res = await this.directory.resource.formColl.find(forms);
      if (res.length > 0) {
        for (const item of res) {
          const form = new Form(item, this.directory);
          await form.loadContent();
          this.forms[form.id] = form;
        }
      }
    }
  }

  async loadTransfers(transferIds?: (string | undefined)[]) {
    const transfers: string[] = [];
    transferIds?.forEach((item) => {
      if (item && !this.transfers[item]) {
        transfers.push(item);
      }
    });
    if (transfers.length > 0) {
      const res = await this.directory.resource.transferColl.find(transfers);
      if (res.length > 0) {
        for (const item of res) {
          const transfer = new Transfer(item, this.directory);
          this.transfers[item.id] = transfer;
          await transfer.initializing();
        }
      }
    }
  }

  async loadWorks(appIds?: (string | undefined)[], workIds?: (string | undefined)[]) {
    const applications: string[] = [];
    appIds?.forEach((item) => {
      if (item && !this.applications[item]) {
        applications.push(item);
      }
    });
    if (applications.length > 0) {
      const result = await this.directory.resource.applicationColl.find(applications);
      if (result.length > 0) {
        for (const item of result) {
          const application = new Application(item, this.directory);
          this.applications[item.id] = application;
          for (const work of await application.loadWorks()) {
            if (workIds?.includes(work.id)) {
              this.works[work.id] = work;
            }
          }
        }
      }
    }
  }

  async initializing(): Promise<boolean> {
    const formIds: (string | undefined)[] = [];
    const transferIds: (string | undefined)[] = [];
    const appIds: (string | undefined)[] = [];
    const workIds: (string | undefined)[] = [];
    for (const node of this.nodes) {
      switch (node.typeName) {
        case '子图':
          transferIds.push((node as any).transferId);
          break;
        case '存储':
          appIds.push((node as any).applicationId);
          workIds.push((node as any).workId);
          break;
        case '映射':
          formIds.push(...[(node as any).source, (node as any).target]);
          break;
        case '表单':
          formIds.push((node as any).formId);
          break;
        case '表格':
          formIds.push(...(node as any).formIds);
          break;
      }
    }
    await this.loadForms(formIds);
    await this.loadTransfers(transferIds);
    await this.loadWorks(appIds, workIds);
    return true;
  }

  hasLoop(): boolean {
    const hasLoop = (node: model.Node, chain: Set<string>) => {
      for (const edge of this.metadata.edges) {
        if (edge.start == node.id) {
          for (const next of this.metadata.nodes) {
            if (edge.end == next.id) {
              if (chain.has(next.id)) {
                return true;
              }
              if (hasLoop(next, new Set([...chain, next.id]))) {
                return true;
              }
            }
          }
        }
      }
      return false;
    };
    const not = this.metadata.edges.map((item) => item.end);
    const roots = this.metadata.nodes.filter((item) => not.indexOf(item.id) == -1);
    for (const root of roots) {
      if (hasLoop(root, new Set<string>([root.id]))) {
        return true;
      }
    }
    return false;
  }

  async request(request: model.Request, env?: model.KeyValue): Promise<boolean> {
    let json = JSON.stringify(request.data);
    for (const match of json.matchAll(/\{\{[^{}]*\}\}/g)) {
      for (let index = 0; index < match.length; index++) {
        let matcher = match[index];
        let varName = matcher.substring(2, matcher.length - 2);
        json = json.replaceAll(matcher, env?.[varName] ?? '');
      }
    }
    let res = await kernel.httpForward(JSON.parse(json));
    return res.data?.content ? JSON.parse(res.data.content) : res;
  }

  async update(data: model.Transfer): Promise<boolean> {
    if (this.getData) {
      data.graph = this.getData();
    }
    return await super.update(data);
  }

  /** 模板 */
  template<T>(forms: IForm[]): model.Sheet<T>[] {
    const ans: model.Sheet<T>[] = [];
    for (const form of forms) {
      const columns: model.Column[] = [];
      for (const field of form.attributes) {
        columns.push({
          title: field.name,
          dataIndex: field.id,
          valueType: field.property!.valueType,
        });
      }
      ans.push({
        name: form.name,
        columns: columns,
        data: [],
      });
    }
    return ans;
  }

  running(code: string, args: any, env?: model.KeyValue): any {
    const runtime = {
      environment: env ?? {},
      preData: args,
      nextData: {},
      decrypt: common.decrypt,
      encrypt: common.encrypt,
      log: (args: any) => {
        console.log(args);
      },
    };
    common.Sandbox(code)(runtime);
    return runtime.nextData;
  }

  async execute(
    status: model.GStatus,
    event: model.GEvent,
    pre?: ITask,
    data?: any,
  ): Promise<void> {
    this.curTask = new Task(this, event, status, pre);
    this.taskList.push(this.curTask);
    await this.curTask.starting(data);
  }
}

export * from './node';
