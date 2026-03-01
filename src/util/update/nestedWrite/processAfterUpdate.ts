import type { RelationContext } from "../../../types/relationTypes";
import type {
  NestedWriteOperation,
  NestedUpdateInput,
} from "../../../types/nestedWriteTypes";
import { isGassmaAny } from "../../relation/collectKeys";

const isNestedUpdateInput = (value: unknown): value is NestedUpdateInput =>
  typeof value === "object" &&
  value !== null &&
  "where" in value &&
  "data" in value;

const processAfterUpdate = (
  updatedRecord: Record<string, unknown>,
  relationOps: Map<string, NestedWriteOperation>,
  context: RelationContext,
): void => {
  relationOps.forEach((ops, relationName) => {
    const relation = context.relations[relationName];
    if (!relation) return;
    if (relation.type !== "oneToMany") return;

    const rawParentValue = updatedRecord[relation.field];
    if (!isGassmaAny(rawParentValue)) return;
    const parentValue = rawParentValue;

    if (ops.update) {
      const items = Array.isArray(ops.update)
        ? ops.update
        : isNestedUpdateInput(ops.update)
          ? [ops.update]
          : [];
      items.forEach((item) => {
        if (!isNestedUpdateInput(item)) return;
        context.updateManyOnSheet!(relation.to, {
          where: { ...item.where, [relation.reference]: parentValue },
          data: item.data as Record<string, never>,
        });
      });
    }

    if (ops.delete && ops.delete !== true) {
      const items = Array.isArray(ops.delete) ? ops.delete : [ops.delete];
      items.forEach((where) => {
        context.deleteManyOnSheet!(relation.to, {
          where: { ...where, [relation.reference]: parentValue },
        });
      });
    }

    if (ops.deleteMany) {
      const items = Array.isArray(ops.deleteMany)
        ? ops.deleteMany
        : [ops.deleteMany];
      items.forEach((where) => {
        context.deleteManyOnSheet!(relation.to, {
          where: { ...where, [relation.reference]: parentValue },
        });
      });
    }
  });
};

export { processAfterUpdate };
