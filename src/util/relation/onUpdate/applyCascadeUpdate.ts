import type { GassmaAny, WhereUse } from "../../../types/coreTypes";
import type {
  RelationContext,
  RelationDefinition,
} from "../../../types/relationTypes";
import { containsValue } from "../../other/isValueEqual";
import { createTempValueFactory } from "./cascadeTempValue";
import type { CascadeStep, ChangedPair } from "./cascadeUpdatePlan";
import { buildCascadeSteps } from "./cascadeUpdatePlan";

type CascadeTarget = { sheet: string; field: string };

const resolveCascadeTarget = (relation: RelationDefinition): CascadeTarget =>
  relation.type === "manyToMany" && relation.through
    ? { sheet: relation.through.sheet, field: relation.through.field }
    : { sheet: relation.to, field: relation.reference };

const buildStepWhere = (field: string, step: CascadeStep): WhereUse =>
  step.oldValues.length === 1
    ? { [field]: step.oldValues[0] }
    : { [field]: { in: step.oldValues } };

const collectPairValues = (changed: ChangedPair[]): GassmaAny[] => {
  const values: GassmaAny[] = [];
  changed.forEach(({ oldValue, newValue }) => {
    values.push(oldValue, newValue);
  });
  return values;
};

const applyCascadeUpdate = (
  changed: ChangedPair[],
  relation: RelationDefinition,
  context: RelationContext,
): void => {
  if (!context.updateManyOnSheet) return;

  const { sheet, field } = resolveCascadeTarget(relation);
  const reserved = collectPairValues(changed);
  const nextTempValue = createTempValueFactory(
    (candidate) =>
      containsValue(reserved, candidate) ||
      context.findManyOnSheet(sheet, { where: { [field]: candidate } }).length >
        0,
  );

  buildCascadeSteps(changed, nextTempValue).forEach((step) => {
    context.updateManyOnSheet?.(sheet, {
      where: buildStepWhere(field, step),
      data: { [field]: step.newValue },
    });
  });
};

export { applyCascadeUpdate, resolveCascadeTarget };
