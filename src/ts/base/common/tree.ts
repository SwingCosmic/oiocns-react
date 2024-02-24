import { List } from './linq';

/**
 * 树
 */
export class Tree<T extends { [key: string]: any }> {
  /**
   * root 顶级虚拟节点,
   * nodeMap 存储当前节点，
   * freeMap 存储游离的节点，
   * 处理先进来的子节点找不到父类的问题
   */
  readonly root: Node<T>;
  readonly nodeMap: Map<string, Node<T>>;
  readonly freeMap: Map<string, Node<T>>;
  readonly indexMap: Map<string, number>;
  constructor(
    nodeData: T[],
    id: (node: T) => string,
    parentId: (node: T) => string | undefined,
    root?: T,
  ) {
    this.nodeMap = new Map();
    this.freeMap = new Map();
    this.indexMap = new Map();
    if (root) {
      this.root = new Node(id(root), root);
    } else {
      this.root = new Node('root_', {} as T);
    }
    this.nodeMap.set(this.root.id, this.root);
    nodeData.forEach((item, index) => {
      this.addNode(id(item), item, parentId(item));
      this.indexMap.set(id(item), index);
    });
  }

  /**
   * 加入节点
   * @param id 节点 ID
   * @param parentId 父节点 ID
   * @param data 节点数据
   */
  addNode(id: string, data: T, parentId?: string): Node<T> | undefined {
    if (id == null) {
      return;
    }
    if (this.nodeMap.has(id)) {
      return this.nodeMap.get(id);
    }
    let node: Node<T> = new Node<T>(id, data, parentId);
    if (!parentId) this.root.addChild(node);
    else {
      let parentNode: Node<T> | undefined = this.nodeMap.get(parentId);
      if (!parentNode) {
        this.freeMap.set(id, node);
      } else {
        parentNode.addChild(node);
      }
    }
    this.nodeMap.set(id, node);
    return node;
  }

  /**
   * 清空游离的节点
   */
  clearFree() {
    if (this.freeMap.size !== 0) {
      let hasParent: string[] = [];
      this.freeMap.forEach((value, key) => {
        let freeNodeParentId: string = value.parentId!;
        if (this.nodeMap.has(freeNodeParentId)) {
          let parentNode: Node<T> = this.nodeMap.get(freeNodeParentId)!;
          parentNode.addChild(value);
          hasParent.push(key);
        }
      });
      hasParent.forEach((nodeKey) => this.freeMap.delete(nodeKey));
    }
  }
}

/**
 * 可聚合的树
 */
export class AggregateTree<T extends { [key: string]: any }> extends Tree<T> {
  /**
   * 从低向上汇总一棵树数据
   * @param binaryOperator
   */
  summary(binaryOperator: (pre: T, cur: T, index: number, arr: T[]) => T) {
    let levels: Node<T>[][] = [];
    let queue: Node<T>[] = [];
    queue = queue.concat(this.root.children);

    while (queue.length !== 0) {
      let currentLevel: Node<T>[] = [];
      let children: Node<T>[] = [];
      while (queue.length !== 0) {
        let first: Node<T> = queue.shift()!;
        currentLevel.push(first);
        children = children.concat(first.children);
      }
      queue = children;
      levels.push(currentLevel);
    }

    for (let index = levels.length - 1; index >= 1; index--) {
      let level = levels[index].filter((item) => item.parentId);
      let group = new List(level).GroupBy((node) => node.parentId!);
      for (let parentId of Object.keys(group)) {
        let nodes: Node<T>[] = group[parentId];
        let parentNode = this.nodeMap.get(parentId)!;
        parentNode.data = nodes
          .map((node) => node.data)
          .reduce(binaryOperator, parentNode.data);
      }
    }
  }
}

/**
 * 节点
 */
export class Node<T extends { [key: string]: any }> {
  readonly id: string;
  readonly parentId?: string;
  readonly children: Node<T>[];
  public data: T;

  constructor(id: string, data: T, parentId?: string) {
    this.id = id;
    this.parentId = parentId;
    this.data = data;
    this.children = [];
  }

  public addChild(node: Node<T>) {
    this.children.push(node);
  }
}
