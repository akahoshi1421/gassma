import type { RelationContext } from "../../../types/relationTypes";
import type { NestedWriteOperation } from "../../../types/nestedWriteTypes";
import { NestedWriteConnectNotFoundError } from "../../../errors/relation/nestedWriteError";

const processBeforeCreate = (
  scalarData: Record<string, unknown>,
  relationOps: Map<string, NestedWriteOperation>,
  context: RelationContext,
): Record<string, unknown> => {
  const enrichedData = { ...scalarData };

  relationOps.forEach((ops, relationName) => {
    const relation = context.relations[relationName];
    if (!relation) return;
    if (relation.type !== "manyToOne" && relation.type !== "oneToOne") return;

    if (ops.connect) {
      const where = Array.isArray(ops.connect) ? ops.connect[0] : ops.connect;
      const found = context.findManyOnSheet(relation.to, { where });
      if (found.length === 0) {
        throw new NestedWriteConnectNotFoundError(relation.to);
      }
      enrichedData[relation.field] = found[0][relation.reference];
      return;
    }

    if (ops.create && !Array.isArray(ops.create)) {
      const created = context.createOnSheet!(relation.to, {
        data: ops.create,
      });
      enrichedData[relation.field] = created[relation.reference];
      return;
    }

    if (ops.connectOrCreate) {
      const input = Array.isArray(ops.connectOrCreate)
        ? ops.connectOrCreate[0]
        : ops.connectOrCreate;
      const found = context.findManyOnSheet(relation.to, {
        where: input.where,
      });
      if (found.length > 0) {
        enrichedData[relation.field] = found[0][relation.reference];
      } else {
        const created = context.createOnSheet!(relation.to, {
          data: input.create,
        });
        enrichedData[relation.field] = created[relation.reference];
      }
    }
  });

  return enrichedData;
};

export { processBeforeCreate };
