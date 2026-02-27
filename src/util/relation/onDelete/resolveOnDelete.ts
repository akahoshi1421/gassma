import type { RelationContext } from "../../../types/relationTypes";
import { RelationOnDeleteRestrictError } from "../../../errors/relation/relationError";
import { collectKeys } from "../collectKeys";

const resolveOnDelete = (
  deletingRecords: Record<string, unknown>[],
  context: RelationContext,
): void => {
  const entries = Object.entries(context.relations);

  // Phase 1: Restrict チェックを全て先に実行
  entries.forEach(([relationName, relation]) => {
    if (relation.onDelete !== "Restrict") return;

    const parentValues = collectKeys(deletingRecords, relation.field);

    const targetSheet =
      relation.type === "manyToMany" && relation.through
        ? relation.through.sheet
        : relation.to;
    const targetField =
      relation.type === "manyToMany" && relation.through
        ? relation.through.field
        : relation.reference;

    const children = context.findManyOnSheet(targetSheet, {
      where: { [targetField]: { in: parentValues } },
    });

    if (children.length > 0) {
      throw new RelationOnDeleteRestrictError(relationName);
    }
  });

  // Phase 2: Cascade / SetNull を実行
  entries.forEach(([, relation]) => {
    if (
      !relation.onDelete ||
      relation.onDelete === "NoAction" ||
      relation.onDelete === "Restrict"
    ) {
      return;
    }

    const parentValues = collectKeys(deletingRecords, relation.field);

    if (relation.onDelete === "Cascade") {
      if (relation.type === "manyToMany" && relation.through) {
        context.deleteManyOnSheet?.(relation.through.sheet, {
          where: { [relation.through.field]: { in: parentValues } },
        });
      } else {
        context.deleteManyOnSheet?.(relation.to, {
          where: { [relation.reference]: { in: parentValues } },
        });
      }
    }

    if (relation.onDelete === "SetNull") {
      if (relation.type === "manyToMany") return;

      context.updateManyOnSheet?.(relation.to, {
        where: { [relation.reference]: { in: parentValues } },
        data: { [relation.reference]: null },
      });
    }
  });
};

export { resolveOnDelete };
