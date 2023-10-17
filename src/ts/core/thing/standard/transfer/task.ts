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
  /** 启动状态 */
  status: model.GStatus;
  /** 启动事件 */
  event: model.GEvent;
  /** 开始执行 */
  starting(data?: any): Promise<void>;
}

export class Task implements ITask {
  command: Command;
  transfer: ITransfer;
  metadata: model.Task;
  visitedNodes: Map<string, { code: string; data: any }>;
  visitedEdges: Set<string>;
  nodes: INode[];
  preTask?: ITask;
  status: model.GStatus;
  event: model.GEvent;

  constructor(
    status: model.GStatus,
    event: model.GEvent,
    transfer: ITransfer,
    task?: ITask,
  ) {
    this.transfer = transfer;
    this.command = transfer.command;
    this.status = status;
    this.event = event;
    if (task) {
      this.metadata = deepClone(task.metadata);
    } else {
      this.metadata = deepClone({
        id: generateUuid(),
        status: status,
        nodes: transfer.metadata.nodes.map((item) => {
          return {
            ...item,
            status: 'Stop',
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
    if (await this.tryRunning()) {
      const not = this.metadata.edges.map((item) => item.end);
      const roots = this.nodes.filter((item) => !not.includes(item.metadata.id));
      await Promise.all(roots.map((root) => this.visitNode(root, data)));
    }
  }

  async visitNode(node: INode, data?: any): Promise<void> {
    await node.executing(data, this.transfer.curEnv?.params);
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
          await this.transfer.execute(this.status, this.event, this, nextData);
        }
      }
    }
  }
}
