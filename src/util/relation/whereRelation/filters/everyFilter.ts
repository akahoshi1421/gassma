import type { RelationDefinition } from "../../../../types/relationTypes";
import type { GassmaAny, WhereUse } from "../../../../types/coreTypes";
import { collectKeys } from "../../collectKeys";
import { isGassmaAny } from "../../collectKeys";

type FindManyOnSheet = (
  sheetName: string,
  findData: { where?: WhereUse },
) => Record<string, unknown>[];

const countByKey = (
  records: Record<string, unknown>[],
  keyField: string,
): Map<unknown, number> => {
  const counts = new Map<unknown, number>();
  records.forEach((r) => {
    const key = r[keyField];
    if (!isGassmaAny(key)) return;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return counts;
};

const findFailingKeys = (
  allCounts: Map<unknown, number>,
  matchCounts: Map<unknown, number>,
): GassmaAny[] => {
  const failing: GassmaAny[] = [];
  allCounts.forEach((total, key) => {
    const matched = matchCounts.get(key) ?? 0;
    if (matched < total && isGassmaAny(key)) {
      failing.push(key);
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
    collectKeys(matchTargets, relation.reference).map(String),
  );

  const matchJunctions = allJunctions.filter((j) => {
    const ref = j[through.reference];
    return isGassmaAny(ref) && matchTargetKeys.has(String(ref));
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
