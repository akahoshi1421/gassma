import type { RelationDefinition } from "../../../../types/relationTypes";
import type { GassmaAny, WhereUse } from "../../../../types/coreTypes";
import { toLookupKey } from "../../../other/toLookupKey";
import { collectKeys } from "../../collectKeys";
import { isGassmaAny } from "../../collectKeys";

type FindManyOnSheet = (
  sheetName: string,
  findData: { where?: WhereUse },
) => Record<string, unknown>[];

type KeyCount = { value: GassmaAny; count: number };

const countByKey = (
  records: Record<string, unknown>[],
  keyField: string,
): Map<unknown, KeyCount> => {
  const counts = new Map<unknown, KeyCount>();
  records.forEach((r) => {
    const key = r[keyField];
    if (!isGassmaAny(key)) return;
    const lookupKey = toLookupKey(key);
    const entry = counts.get(lookupKey);
    if (entry) {
      entry.count += 1;
      return;
    }
    counts.set(lookupKey, { value: key, count: 1 });
  });
  return counts;
};

const findFailingKeys = (
  allCounts: Map<unknown, KeyCount>,
  matchCounts: Map<unknown, KeyCount>,
): GassmaAny[] => {
  const failing: GassmaAny[] = [];
  allCounts.forEach((entry, key) => {
    const matched = matchCounts.get(key)?.count ?? 0;
    if (matched < entry.count) {
      failing.push(entry.value);
    }
  });
  return failing;
};

const applyEveryFilterOneToMany = (
  relation: RelationDefinition,
  filterWhere: WhereUse,
  findManyOnSheet: FindManyOnSheet,
): WhereUse => {
  const allChildren = findManyOnSheet(relation.to, { where: {} });
  if (allChildren.length === 0) {
    return { [relation.field]: { notIn: [] } };
  }

  const matchChildren = findManyOnSheet(relation.to, { where: filterWhere });

  const allCounts = countByKey(allChildren, relation.reference);
  const matchCounts = countByKey(matchChildren, relation.reference);
  const failing = findFailingKeys(allCounts, matchCounts);

  return { [relation.field]: { notIn: failing } };
};

const applyEveryFilterManyToMany = (
  relation: RelationDefinition,
  filterWhere: WhereUse,
  findManyOnSheet: FindManyOnSheet,
): WhereUse => {
  const through = relation.through!;

  const allJunctions = findManyOnSheet(through.sheet, { where: {} });
  if (allJunctions.length === 0) {
    return { [relation.field]: { notIn: [] } };
  }

  const allCounts = countByKey(allJunctions, through.field);

  const matchTargets = findManyOnSheet(relation.to, { where: filterWhere });
  const matchTargetKeys = new Set(
    collectKeys(matchTargets, relation.reference).map(toLookupKey),
  );

  const matchJunctions = allJunctions.filter((j) => {
    const ref = j[through.reference];
    return isGassmaAny(ref) && matchTargetKeys.has(toLookupKey(ref));
  });
  const matchCounts = countByKey(matchJunctions, through.field);

  const failing = findFailingKeys(allCounts, matchCounts);
  return { [relation.field]: { notIn: failing } };
};

const applyEveryFilter = (
  relation: RelationDefinition,
  _relationName: string,
  filterWhere: WhereUse,
  findManyOnSheet: FindManyOnSheet,
): WhereUse => {
  if (relation.type === "manyToMany") {
    return applyEveryFilterManyToMany(relation, filterWhere, findManyOnSheet);
  }
  return applyEveryFilterOneToMany(relation, filterWhere, findManyOnSheet);
};

export { applyEveryFilter };
