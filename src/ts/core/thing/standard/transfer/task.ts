/* eslint-disable no-unused-vars */
import { Command, model } from '../../../../base';
import { deepClone, generateUuid } from '../../../../base/common';
import { ITransfer } from './index';
import { INode, createNode } from './node';

export interface ITask {
  /** 触发器 */
  command: Command;
  /** 迁移配置 */
  transfer: ITransfer;
  /** 元数据 */
  metadata: model.Task;
  /** 已遍历点（存储数据） */
  visitedNodes: Map<string, { code: string; data: any }>;
  /** 已遍历边 */
  visitedEdges: Set<string>;
  /** 节点 */
  nodes: INode[];
  /** 前置任务 */
  preTask?: ITask;
  /** 启动事件 */
  initEvent: model.GEvent;
  /** 启动状态 */
  initStatus: model.GStatus;
  /** 开始执行 */
  starting(data?: any): Promise<void>;
}

const Machine: model.Shift<model.GEvent, model.GStatus>[] = [
  { start: 'Editable', event: 'Prepare', end: 'Viewable' },
  { start: 'Viewable', event: 'Run', end: 'Running' },
  { start: 'Running', event: 'Completed', end: 'Completed' },
  { start: 'Running', event: 'Throw', end: 'Error' },
];

export class Task implements ITask {
  command: Command;
  transfer: ITransfer;
  metadata: model.Task;
  visitedNodes: Map<string, { code: string; data: any }>;
  visitedEdges: Set<string>;
  nodes: INode[];
  initEvent: model.GEvent;
  initStatus: model.GStatus;
  preTask?: ITask;

  constructor(
    transfer: ITransfer,
    initEvent: model.GEvent,
    initStatus: model.GStatus,
    task?: ITask,
  ) {
    this.transfer = transfer;
    this.command = transfer.command;
    this.initEvent = initEvent;
    this.initStatus = initStatus;
    if (task) {
      this.metadata = deepClone(task.metadata);
    } else {
      this.metadata = deepClone({
        id: generateUuid(),
        status: initStatus,
        nodes: transfer.metadata.nodes.map((item) => {
          return {
            ...item,
            status: initStatus,
          };
        }),
        env: transfer.curEnv,
        edges: transfer.metadata.edges,
        graph: transfer.metadata.graph,
        startTime: new Date(),
      });
    }
    this.nodes = this.metadata.nodes.map((item) => createNode(this, item));
    this.visitedNodes = new Map();
    this.visitedEdges = new Set();
    this.preTask = task;
  }

  async starting(data?: any): Promise<void> {
    this.machine(this.initEvent);
    this.refreshEnvs();
    this.refreshTasks();
    await this.iterateRoots(data);
  }

  refreshEnvs() {
    this.command.emitter('environments', 'refresh');
  }

  refreshTasks() {
    this.command.emitter('tasks', 'refresh');
  }

  machine(event: model.GEvent): void {
    if (this.metadata.status == 'Error') {
      return;
    }
    for (const shift of Machine) {
      if (shift.start == this.metadata.status && event == shift.event) {
        this.metadata.status = shift.end;
        this.command.emitter('graph', 'status', this.metadata.status);
      }
    }
  }

  async visitNode(node: INode, data?: any): Promise<void> {
    await node.executing(data, this.transfer.curEnv?.params);
    this.refreshEnvs();
    if (await this.tryRunning()) {
      await this.next(node);
    }
  }

  private preCheck(node: INode): { s: boolean; d: { [key: string]: any } } {
    let data: { [key: string]: any } = {};
    for (const edge of this.metadata.edges) {
      if (node.metadata.id == edge.end) {
        if (!this.visitedEdges.has(edge.id)) {
          return { s: false, d: {} };
        }
        if (this.visitedNodes.has(edge.start)) {
          const nodeData = this.visitedNodes.get(edge.start)!;
          data[nodeData.code] = nodeData.data;
        }
      }
    }
    if (Object.keys(data).length == 1) {
      return { s: true, d: data[Object.keys(data)[0]] };
    }
    return { s: true, d: data };
  }

  async iterateRoots(data?: any): Promise<void> {
    if (await this.tryRunning()) {
      const not = this.metadata.edges.map((item) => item.end);
      const roots = this.nodes.filter((item) => !not.includes(item.metadata.id));
      await Promise.all(roots.map((root) => this.visitNode(root, data)));
    }
  }

  async next(preNode: INode): Promise<void> {
    for (const edge of this.metadata.edges) {
      if (preNode.metadata.id == edge.start) {
        this.visitedEdges.add(edge.id);
        for (const node of this.nodes) {
          if (node.metadata.id == edge.end) {
            const next = this.preCheck(node);
            if (next.s) {
              await this.visitNode(node, next.d);
            }
          }
        }
      }
    }
  }

  async tryRunning(nextData?: any): Promise<boolean> {
    if (this.visitedNodes.size == this.metadata.nodes.length) {
      this.metadata.endTime = new Date();
      this.machine('Completed');
      this.refreshTasks();
      if (this.initStatus == 'Editable') {
        this.command.emitter('graph', 'status', 'Editable');
      } else if (this.initStatus == 'Viewable') {
        this.command.emitter('graph', 'status', 'Viewable');
      }
      await this.selfCircle(nextData);
      return false;
    }
    return true;
  }

  async selfCircle(nextData?: any) {
    if (this.transfer.metadata.isSelfCirculation) {
      let judge = this.transfer.metadata.judge;
      if (judge) {
        let params = this.metadata.env?.params;
        const res = this.transfer.running(judge, nextData, params);
        if (res.success) {
          await this.transfer.execute(this.initStatus, this.initEvent, this, nextData);
        }
      }
    }
  }
}
