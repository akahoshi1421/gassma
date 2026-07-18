import type { GassmaAny, WhereUse } from "../../../types/coreTypes";
import type {
  RelationContext,
  RelationDefinition,
} from "../../../types/relationTypes";
import type { NestedWriteOperation } from "../../../types/nestedWriteTypes";
import {
  NestedWriteConnectNotFoundError,
  NestedWriteInvalidOperationError,
} from "../../../errors/relation/nestedWriteError";
import { isGassmaAny } from "../../relation/collectKeys";

const findInvalidOperation = (ops: NestedWriteOperation): string | null => {
  if (ops.createMany !== undefined) return "createMany";
  if (Array.isArray(ops.create)) return "create";
  if (Array.isArray(ops.connect)) return "connect";
  if (Array.isArray(ops.connectOrCreate)) return "connectOrCreate";
  return null;
};

const assertValidOps = (
  relationName: string,
  relation: RelationDefinition,
  ops: NestedWriteOperation,
): void => {
  const invalidOperation = findInvalidOperation(ops);
  if (invalidOperation === null) return;
  throw new NestedWriteInvalidOperationError(
    relationName,
    invalidOperation,
    relation.type,
  );
};

const connectByWhere = (
  relation: RelationDefinition,
  where: WhereUse,
  parentValue: GassmaAny,
  context: RelationContext,
): void => {
  context.updateManyOnSheet!(relation.to, {
    where: { [relation.reference]: parentValue },
    data: { [relation.reference]: null },
  });
  context.updateManyOnSheet!(relation.to, {
    where,
    data: { [relation.reference]: parentValue },
  });
};

const processOneToOne = (
  writtenRecord: Record<string, unknown>,
  relationOps: Map<string, NestedWriteOperation>,
  context: RelationContext,
): void => {
  relationOps.forEach((ops, relationName) => {
    const relation = context.relations[relationName];
    if (!relation) return;
    if (relation.type !== "oneToOne") return;

    assertValidOps(relationName, relation, ops);

    const rawParentValue = writtenRecord[relation.field];
    if (!isGassmaAny(rawParentValue)) return;
    const parentValue = rawParentValue;

    if (ops.create && !Array.isArray(ops.create)) {
      context.createOnSheet!(relation.to, {
        data: { ...ops.create, [relation.reference]: parentValue },
      });
    }

    if (ops.connect && !Array.isArray(ops.connect)) {
      const found = context.findManyOnSheet(relation.to, {
        where: ops.connect,
      });
      if (found.length === 0) {
        throw new NestedWriteConnectNotFoundError(relation.to);
      }
      connectByWhere(relation, ops.connect, parentValue, context);
    }

    if (ops.connectOrCreate && !Array.isArray(ops.connectOrCreate)) {
      const input = ops.connectOrCreate;
      const found = context.findManyOnSheet(relation.to, {
        where: input.where,
      });
      if (found.length > 0) {
        connectByWhere(relation, input.where, parentValue, context);
      } else {
        context.createOnSheet!(relation.to, {
          data: { ...input.create, [relation.reference]: parentValue },
        });
      }
    }
  });
};

export { processOneToOne };
