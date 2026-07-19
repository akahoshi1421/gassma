import { hasOwnKey } from "./hasOwnKey";
import { isRecordValue } from "./isRecordValue";
import type { ResultTreeNode } from "./prepareResultTree";
import { shapeRecord } from "./transformResult";

const transformResultTree = (raw: any, node: ResultTreeNode): any => {
  if (Array.isArray(raw)) {
    return raw.map((record) => transformResultTree(record, node));
  }
  if (!isRecordValue(raw)) return raw;
  const shaped = shapeRecord(raw, node.fields, node.plan);
  Object.keys(node.children).forEach((key) => {
    if (!hasOwnKey(shaped, key)) return;
    shaped[key] = transformResultTree(shaped[key], node.children[key]);
  });
  return shaped;
};

export { transformResultTree };
