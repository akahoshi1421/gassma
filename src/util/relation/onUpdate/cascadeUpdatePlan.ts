import type { GassmaAny } from "../../../types/coreTypes";
import { isDateValue } from "../../other/isDateValue";
import { toLookupKey } from "../../other/toLookupKey";

type ChangedPair = {
  oldValue: GassmaAny;
  newValue: GassmaAny;
};

type CascadeStep = {
  oldValues: GassmaAny[];
  newValue: GassmaAny;
};

const isNaNValue = (value: GassmaAny): boolean =>
  typeof value === "number" && Number.isNaN(value);

const isInvalidDateValue = (value: GassmaAny): boolean =>
  isDateValue(value) && Number.isNaN(value.getTime());

const toPlanKey = (value: GassmaAny): unknown =>
  isInvalidDateValue(value) ? value : toLookupKey(value);

const groupPairsByNewValue = (pairs: ChangedPair[]): CascadeStep[] => {
  const groups: CascadeStep[] = [];
  const seenOldKeys = new Set<unknown>();
  const groupByNewKey = new Map<unknown, CascadeStep>();
  pairs.forEach(({ oldValue, newValue }) => {
    const oldKey = toPlanKey(oldValue);
    if (seenOldKeys.has(oldKey)) return;
    seenOldKeys.add(oldKey);
    const mergeable = !(isNaNValue(newValue) || isInvalidDateValue(newValue));
    const group = mergeable
      ? groupByNewKey.get(toPlanKey(newValue))
      : undefined;
    if (group) {
      group.oldValues.push(oldValue);
      return;
    }
    const created: CascadeStep = { oldValues: [oldValue], newValue };
    groups.push(created);
    if (mergeable) groupByNewKey.set(toPlanKey(newValue), created);
  });
  return groups;
};

const createIndexMinHeap = () => {
  const heap: number[] = [];
  const swap = (a: number, b: number): void => {
    const tmp = heap[a];
    heap[a] = heap[b];
    heap[b] = tmp;
  };
  const push = (value: number): void => {
    heap.push(value);
    let i = heap.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (heap[parent] <= heap[i]) break;
      swap(parent, i);
      i = parent;
    }
  };
  const pop = (): number | undefined => {
    if (heap.length === 0) return undefined;
    const top = heap[0];
    const last = heap.pop();
    if (heap.length === 0 || last === undefined) return top;
    heap[0] = last;
    let i = 0;
    let smallest = 0;
    do {
      i = smallest;
      const left = i * 2 + 1;
      const right = left + 1;
      if (left < heap.length && heap[left] < heap[smallest]) smallest = left;
      if (right < heap.length && heap[right] < heap[smallest]) smallest = right;
      if (smallest !== i) swap(i, smallest);
    } while (smallest !== i);
    return top;
  };
  return { push, pop };
};

const buildBlockerGraph = (groups: CascadeStep[]) => {
  const ownerByOldKey = new Map<unknown, number>();
  groups.forEach((group, index) => {
    group.oldValues.forEach((value) => {
      ownerByOldKey.set(toPlanKey(value), index);
    });
  });
  const childIndexes: number[][] = groups.map(() => []);
  const ready = createIndexMinHeap();
  groups.forEach((group, index) => {
    const blocker = ownerByOldKey.get(toPlanKey(group.newValue));
    if (blocker === undefined || blocker === index) {
      ready.push(index);
      return;
    }
    childIndexes[blocker].push(index);
  });
  return { childIndexes, ready };
};

const buildCascadeSteps = (
  pairs: ChangedPair[],
  nextTempValue: () => GassmaAny,
): CascadeStep[] => {
  const groups = groupPairsByNewValue(pairs);
  const { childIndexes, ready } = buildBlockerGraph(groups);
  const steps: CascadeStep[] = [];
  const deferred: CascadeStep[] = [];
  const done: boolean[] = groups.map(() => false);
  const finish = (index: number): void => {
    done[index] = true;
    childIndexes[index].forEach((child) => {
      ready.push(child);
    });
  };
  let cursor = 0;
  let remaining = groups.length;
  while (remaining > 0) {
    const index = ready.pop();
    if (index !== undefined) {
      if (done[index]) continue;
      steps.push(groups[index]);
      finish(index);
      remaining -= 1;
      continue;
    }
    while (done[cursor]) cursor += 1;
    const cyclic = groups[cursor];
    const tempValue = nextTempValue();
    steps.push({ oldValues: cyclic.oldValues, newValue: tempValue });
    deferred.push({ oldValues: [tempValue], newValue: cyclic.newValue });
    finish(cursor);
    remaining -= 1;
  }
  return steps.concat(deferred);
};

export { buildCascadeSteps };
export type { CascadeStep, ChangedPair };
