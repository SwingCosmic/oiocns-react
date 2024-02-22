export const getParentKey = (key: any, tree: any) => {
  let parentKey: any;
  for (let i = 0; i < tree.length; i++) {
    const node = tree[i];
    if (node.children) {
      if (node.children.some((item: any) => item.value === key)) {
        parentKey = node.value;
      } else if (getParentKey(key, node.children)) {
        parentKey = getParentKey(key, node.children);
      }
    }
  }
  return parentKey;
};

export const organizeData = (items: any, parentId = undefined) => {
  return items
    .filter((item: any) => item.parentId === parentId)
    .map((item: any) => ({ ...item, children: organizeData(items, item.id) }));
};
