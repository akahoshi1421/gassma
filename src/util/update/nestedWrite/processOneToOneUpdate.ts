import type { AnyUse } from "../../../types/coreTypes";
import type { RelationContext } from "../../../types/relationTypes";
import type { NestedWriteOperation } from "../../../types/nestedWriteTypes";
import {
  NestedWriteInvalidOperationError,
  NestedWriteTargetNotFoundError,
} from "../../../errors/relation/nestedWriteError";
import { isGassmaAny } from "../../relation/collectKeys";

const isBareUpdateData = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  !("where" in value && "data" in value);

const findInvalidOperation = (ops: NestedWriteOperation): string | null => {
  if (ops.set !== undefined) return "set";
  if (ops.deleteMany !== undefined) return "deleteMany";
  if (ops.update !== undefined && !isBareUpdateData(ops.update)) {
    return "update";
  }
  if (ops.disconnect !== undefined && ops.disconnect !== true) {
    return "disconnect";
  }
  if (ops.delete !== undefined && ops.delete !== true) return "delete";
  return null;
};

const processOneToOneUpdate = (
  updatedRecord: Record<string, unknown>,
  relationOps: Map<string, NestedWriteOperation>,
  context: RelationContext,
): void => {
  relationOps.forEach((ops, relationName) => {
    const relation = context.relations[relationName];
    if (!relation) return;
    if (relation.type !== "oneToOne") return;

    const invalidOperation = findInvalidOperation(ops);
    if (invalidOperation !== null) {
      throw new NestedWriteInvalidOperationError(
        relationName,
        invalidOperation,
        relation.type,
      );
    }

    const rawParentValue = updatedRecord[relation.field];
    if (!isGassmaAny(rawParentValue)) return;
    const parentValue = rawParentValue;

    if (ops.update !== undefined && isBareUpdateData(ops.update)) {
      const result = context.updateManyOnSheet!(relation.to, {
        where: { [relation.reference]: parentValue },
        data: ops.update as AnyUse,
      });
      if (result.count === 0) {
        throw new NestedWriteTargetNotFoundError(relation.to, "update");
      }
    }

    if (ops.disconnect === true) {
      context.updateManyOnSheet!(relation.to, {
        where: { [relation.reference]: parentValue },
        data: { [relation.reference]: null },
      });
    }

    if (ops.delete === true) {
      const result = context.deleteManyOnSheet!(relation.to, {
        where: { [relation.reference]: parentValue },
      });
      if (result.count === 0) {
        throw new NestedWriteTargetNotFoundError(relation.to, "delete");
      }
    }
  });
};

export { processOneToOneUpdate };
