import { RelationOnUpdateRestrictError } from "../../../errors/relation/relationError";
import type { RelationContext } from "../../../types/relationTypes";
import { isValueEqual } from "../../other/isValueEqual";
import { collectKeys, isGassmaAny } from "../collectKeys";
import { applyCascadeUpdate, resolveCascadeTarget } from "./applyCascadeUpdate";
import type { ChangedPair } from "./cascadeUpdatePlan";

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
    if (isValueEqual(oldValue, newValue)) return;
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

  // Phase 1: Restrict チェックを全て先に実行（manyToOne はスキップ）
  entries.forEach(([relationName, relation]) => {
    if (relation.type === "manyToOne") return;
    if (relation.onUpdate !== "Restrict") return;

    const changed = extractChangedPairs(
      beforeRecords,
      afterRecords,
      relation.field,
    );
    if (changed.length === 0) return;

    const oldValues = changed.map(({ oldValue }) => oldValue);
    const { sheet, field } = resolveCascadeTarget(relation);

    const children = context.findManyOnSheet(sheet, {
      where: { [field]: { in: oldValues } },
    });

    if (children.length > 0) {
      throw new RelationOnUpdateRestrictError(relationName);
    }
  });

  // Phase 2: Cascade / SetNull を実行（manyToOne はスキップ）
  entries.forEach(([, relation]) => {
    if (relation.type === "manyToOne") return;
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
      applyCascadeUpdate(changed, relation, context);
    }

    if (relation.onUpdate === "SetNull") {
      if (relation.type === "manyToMany") return;

      const oldValues = collectKeys(
        beforeRecords.filter((before, i) => {
          const after = afterRecords[i];
          return (
            after &&
            !isValueEqual(before[relation.field], after[relation.field])
          );
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
