import { NestedWriteConnectNotFoundError } from "../../../errors/relation/nestedWriteError";
import type { NestedWriteOperation } from "../../../types/nestedWriteTypes";
import type { RelationContext } from "../../../types/relationTypes";
import { createJunctionWriter } from "./connectBatch/junctionWriter";
import {
  batchManyToManyConnect,
  batchManyToManyConnectOrCreate,
} from "./connectBatch/manyToManyItems";

const processManyToMany = (
  createdRecord: Record<string, unknown>,
  relationOps: Map<string, NestedWriteOperation>,
  context: RelationContext,
): void => {
  relationOps.forEach((ops, relationName) => {
    const relation = context.relations[relationName];
    if (!relation) return;
    if (relation.type !== "manyToMany" || !relation.through) return;

    const { through } = relation;
    const parentValue = createdRecord[relation.field];
    const selfJunction = through.sheet === relation.to;

    const createJunctionRow = (targetValue: unknown) => {
      context.createOnSheet(through.sheet, {
        data: {
          [through.field]: parentValue,
          [through.reference]: targetValue,
        },
      });
    };

    if (ops.create) {
      const items = Array.isArray(ops.create) ? ops.create : [ops.create];
      items.forEach((item) => {
        const created = context.createOnSheet(relation.to, { data: item });
        createJunctionRow(created[relation.reference]);
      });
    }

    const junction = createJunctionWriter(context, through, parentValue);

    if (ops.connect) {
      const items = Array.isArray(ops.connect) ? ops.connect : [ops.connect];
      if (items.length > 1 && !selfJunction) {
        batchManyToManyConnect(relation, items, context, junction);
      } else {
        items.forEach((where) => {
          const found = context.findManyOnSheet(relation.to, { where });
          if (found.length === 0) {
            throw new NestedWriteConnectNotFoundError(relation.to);
          }
          createJunctionRow(found[0][relation.reference]);
        });
      }
    }

    if (ops.connectOrCreate) {
      const items = Array.isArray(ops.connectOrCreate)
        ? ops.connectOrCreate
        : [ops.connectOrCreate];
      if (items.length > 1 && !selfJunction) {
        batchManyToManyConnectOrCreate(relation, items, context, junction);
        return;
      }
      items.forEach((input) => {
        const found = context.findManyOnSheet(relation.to, {
          where: input.where,
        });
        if (found.length > 0) {
          createJunctionRow(found[0][relation.reference]);
        } else {
          const created = context.createOnSheet(relation.to, {
            data: input.create,
          });
          createJunctionRow(created[relation.reference]);
        }
      });
    }
  });
};

export { processManyToMany };
