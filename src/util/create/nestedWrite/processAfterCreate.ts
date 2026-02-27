import type { AnyUse } from "../../../types/coreTypes";
import type { RelationContext } from "../../../types/relationTypes";
import type { NestedWriteOperation } from "../../../types/nestedWriteTypes";
import { NestedWriteConnectNotFoundError } from "../../../errors/relation/nestedWriteError";
import { isGassmaAny } from "../../relation/collectKeys";

const processAfterCreate = (
  createdRecord: Record<string, unknown>,
  relationOps: Map<string, NestedWriteOperation>,
  context: RelationContext,
): void => {
  relationOps.forEach((ops, relationName) => {
    const relation = context.relations[relationName];
    if (!relation) return;
    if (relation.type !== "oneToMany") return;

    const rawParentValue = createdRecord[relation.field];
    if (!isGassmaAny(rawParentValue)) return;
    const parentValue = rawParentValue;

    if (ops.create) {
      const items = Array.isArray(ops.create) ? ops.create : [ops.create];
      items.forEach((item) => {
        context.createOnSheet!(relation.to, {
          data: { ...item, [relation.reference]: parentValue },
        });
      });
    }

    if (ops.createMany) {
      const enrichedData: AnyUse[] = ops.createMany.data.map((item) => ({
        ...item,
        [relation.reference]: parentValue,
      }));
      context.createManyOnSheet!(relation.to, { data: enrichedData });
    }

    if (ops.connect) {
      const items = Array.isArray(ops.connect) ? ops.connect : [ops.connect];
      const fkData: AnyUse = { [relation.reference]: parentValue };
      items.forEach((where) => {
        const found = context.findManyOnSheet(relation.to, { where });
        if (found.length === 0) {
          throw new NestedWriteConnectNotFoundError(relation.to);
        }
        context.updateManyOnSheet!(relation.to, { where, data: fkData });
      });
    }

    if (ops.connectOrCreate) {
      const items = Array.isArray(ops.connectOrCreate)
        ? ops.connectOrCreate
        : [ops.connectOrCreate];
      items.forEach((input) => {
        const found = context.findManyOnSheet(relation.to, {
          where: input.where,
        });
        if (found.length > 0) {
          const fkData: AnyUse = { [relation.reference]: parentValue };
          context.updateManyOnSheet!(relation.to, {
            where: input.where,
            data: fkData,
          });
        } else {
          context.createOnSheet!(relation.to, {
            data: { ...input.create, [relation.reference]: parentValue },
          });
        }
      });
    }
  });
};

export { processAfterCreate };
