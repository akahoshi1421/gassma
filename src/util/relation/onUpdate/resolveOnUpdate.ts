import type { GassmaAny } from "../../../types/coreTypes";
import type { RelationContext } from "../../../types/relationTypes";
import { RelationOnUpdateRestrictError } from "../../../errors/relation/relationError";
import { collectKeys, isGassmaAny } from "../collectKeys";

type ChangedPair = {
  oldValue: GassmaAny;
  newValue: GassmaAny;
};

const extractChangedPairs = (
  beforeRecords: Record<string, unknown>[],
  afterRecords: Record<string, unknown>[],
  field: string,
): ChangedPair[] => {
  const pairs: ChangedPair[] = [];
  beforeRecords.forEach((before, i) => {
    const after = afterRecords[i];
    if (!after) return;
    const oldValue = before[field];
    const newValue = after[field];
    if (oldValue === newValue) return;
    if (!isGassmaAny(oldValue) || !isGassmaAny(newValue)) return;
    pairs.push({ oldValue, newValue });
  });
  return pairs;
};

const resolveOnUpdate = (
  beforeRecords: Record<string, unknown>[],
  afterRecords: Record<string, unknown>[],
  context: RelationContext,
): void => {
  const entries = Object.entries(context.relations);

  // Phase 1: Restrict チェックを全て先に実行
  entries.forEach(([relationName, relation]) => {
    if (relation.onUpdate !== "Restrict") return;

    const changed = extractChangedPairs(
      beforeRecords,
      afterRecords,
      relation.field,
    );
    if (changed.length === 0) return;

    const oldValues = changed.map(({ oldValue }) => oldValue);

    const targetSheet =
      relation.type === "manyToMany" && relation.through
        ? relation.through.sheet
        : relation.to;
    const targetField =
      relation.type === "manyToMany" && relation.through
        ? relation.through.field
        : relation.reference;

    const children = context.findManyOnSheet(targetSheet, {
      where: { [targetField]: { in: oldValues } },
    });

    if (children.length > 0) {
      throw new RelationOnUpdateRestrictError(relationName);
    }
  });

  // Phase 2: Cascade / SetNull を実行
  entries.forEach(([, relation]) => {
    if (
      !relation.onUpdate ||
      relation.onUpdate === "NoAction" ||
      relation.onUpdate === "Restrict"
    ) {
      return;
    }

    const changed = extractChangedPairs(
      beforeRecords,
      afterRecords,
      relation.field,
    );
    if (changed.length === 0) return;

    if (relation.onUpdate === "Cascade") {
      changed.forEach(({ oldValue, newValue }) => {
        if (relation.type === "manyToMany" && relation.through) {
          context.updateManyOnSheet?.(relation.through.sheet, {
            where: { [relation.through.field]: oldValue },
            data: { [relation.through.field]: newValue },
          });
        } else {
          context.updateManyOnSheet?.(relation.to, {
            where: { [relation.reference]: oldValue },
            data: { [relation.reference]: newValue },
          });
        }
      });
    }

    if (relation.onUpdate === "SetNull") {
      if (relation.type === "manyToMany") return;

      const oldValues = collectKeys(
        beforeRecords.filter((before, i) => {
          const after = afterRecords[i];
          return after && before[relation.field] !== after[relation.field];
        }),
        relation.field,
      );

      context.updateManyOnSheet?.(relation.to, {
        where: { [relation.reference]: { in: oldValues } },
        data: { [relation.reference]: null },
      });
    }
  });
};

export { resolveOnUpdate };
