import type { RelationContext } from "../../../types/relationTypes";
import type { NestedWriteOperation } from "../../../types/nestedWriteTypes";

const processManyToManyUpdate = (
  updatedRecord: Record<string, unknown>,
  relationOps: Map<string, NestedWriteOperation>,
  context: RelationContext,
): void => {
  relationOps.forEach((ops, relationName) => {
    const relation = context.relations[relationName];
    if (!relation) return;
    if (relation.type !== "manyToMany" || !relation.through) return;

    const { through } = relation;
    const parentValue = updatedRecord[relation.field];

    if (ops.disconnect && ops.disconnect !== true) {
      const items = Array.isArray(ops.disconnect)
        ? ops.disconnect
        : [ops.disconnect];
      items.forEach((where) => {
        const found = context.findManyOnSheet(relation.to, { where });
        if (found.length > 0) {
          context.deleteManyOnSheet!(through.sheet, {
            where: {
              [through.field]: parentValue,
              [through.reference]: found[0][relation.reference],
            },
          });
        }
      });
    }

    if (ops.set) {
      context.deleteManyOnSheet!(through.sheet, {
        where: { [through.field]: parentValue },
      });
      ops.set.forEach((where) => {
        const found = context.findManyOnSheet(relation.to, { where });
        if (found.length > 0) {
          context.createOnSheet!(through.sheet, {
            data: {
              [through.field]: parentValue,
              [through.reference]: found[0][relation.reference],
            },
          });
        }
      });
    }
  });
};

export { processManyToManyUpdate };
