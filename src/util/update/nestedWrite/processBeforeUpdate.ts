import type { AnyUse } from "../../../types/coreTypes";
import type { RelationContext } from "../../../types/relationTypes";
import type { NestedWriteOperation } from "../../../types/nestedWriteTypes";
import { isGassmaAny } from "../../relation/collectKeys";

const processBeforeUpdate = (
  currentRecord: Record<string, unknown>,
  enrichedData: Record<string, unknown>,
  relationOps: Map<string, NestedWriteOperation>,
  context: RelationContext,
): void => {
  relationOps.forEach((ops, relationName) => {
    const relation = context.relations[relationName];
    if (!relation) return;
    if (relation.type !== "manyToOne" && relation.type !== "oneToOne") return;

    const fkValue = currentRecord[relation.field];
    if (!isGassmaAny(fkValue)) return;

    if (
      ops.update &&
      typeof ops.update === "object" &&
      !Array.isArray(ops.update) &&
      !("where" in ops.update && "data" in ops.update)
    ) {
      context.updateManyOnSheet!(relation.to, {
        where: { [relation.reference]: fkValue },
        data: ops.update as AnyUse,
      });
      return;
    }

    if (ops.disconnect === true) {
      enrichedData[relation.field] = null;
      return;
    }

    if (ops.delete === true) {
      context.deleteManyOnSheet!(relation.to, {
        where: { [relation.reference]: fkValue },
      });
      enrichedData[relation.field] = null;
    }
  });
};

export { processBeforeUpdate };
