import type { GassmaAny } from "../../../types/coreTypes";
import { containsValue, isValueEqual } from "../../other/isValueEqual";

type ChangedPair = {
  oldValue: GassmaAny;
  newValue: GassmaAny;
};

type CascadeStep = {
  oldValues: GassmaAny[];
  newValue: GassmaAny;
};

const groupPairsByNewValue = (pairs: ChangedPair[]): CascadeStep[] => {
  const groups: CascadeStep[] = [];
  const seenOldValues: GassmaAny[] = [];
  pairs.forEach(({ oldValue, newValue }) => {
    if (containsValue(seenOldValues, oldValue)) return;
    seenOldValues.push(oldValue);
    const group = groups.find((g) => isValueEqual(g.newValue, newValue));
    if (group) {
      group.oldValues.push(oldValue);
      return;
    }
    groups.push({ oldValues: [oldValue], newValue });
  });
  return groups;
};

const isBlocked = (group: CascadeStep, pending: CascadeStep[]): boolean =>
  pending.some(
    (other) =>
      other !== group && containsValue(other.oldValues, group.newValue),
  );

const buildCascadeSteps = (
  pairs: ChangedPair[],
  nextTempValue: () => GassmaAny,
): CascadeStep[] => {
  const pending = groupPairsByNewValue(pairs);
  const steps: CascadeStep[] = [];
  const deferred: CascadeStep[] = [];

  while (pending.length > 0) {
    const index = pending.findIndex((group) => !isBlocked(group, pending));
    if (index >= 0) {
      steps.push(pending[index]);
      pending.splice(index, 1);
      continue;
    }
    const [cyclic] = pending.splice(0, 1);
    const tempValue = nextTempValue();
    steps.push({ oldValues: cyclic.oldValues, newValue: tempValue });
    deferred.push({ oldValues: [tempValue], newValue: cyclic.newValue });
  }

  return steps.concat(deferred);
};

export { buildCascadeSteps };
export type { CascadeStep, ChangedPair };
