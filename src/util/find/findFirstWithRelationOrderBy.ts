import type { FindFirstData } from "../../types/findTypes";
import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import type { RelationContext } from "../../types/relationTypes";
import type { OrderBy } from "../../types/coreTypes";
import { findManyFunc } from "./findMany";
import { resolveRelationOrderBy } from "./findUtil/resolveRelationOrderBy";
import { applySelectOmit } from "./findUtil/applySelectOmit";
import { applyCursor } from "./findUtil/applyCursor";
import { applyDistinct } from "./findUtil/applyDistinct";
import { applyFindFirstTake } from "./findUtil/applyFindFirstTake";
import { applySkipTake } from "./findUtil/applySkipTake";

const findFirstWithRelationOrderBy = (
  controllerUtil: GassmaControllerUtil,
  findData: FindFirstData,
  relationContext: RelationContext,
  orderByArr: OrderBy[],
): Record<string, unknown> | null => {
  const select = "select" in findData ? findData.select : null;
  const omit = "omit" in findData ? findData.omit : null;
  const take = "take" in findData ? findData.take : null;
  const skip = "skip" in findData ? findData.skip : null;
  const distinct = "distinct" in findData ? findData.distinct : null;

  // Step 1: findMany with where only
  const baseRecords = findManyFunc(controllerUtil, {
    where: findData.where,
  });

  // Step 2: resolve relation orderBy (sort)
  const sorted = resolveRelationOrderBy(
    baseRecords,
    orderByArr,
    relationContext,
  );

  // Step 3 以降は Prisma 実測順: take(-1 で反転) → cursor → distinct → skip → 先頭
  const directed = applyFindFirstTake(sorted, take);

  const cursor = "cursor" in findData ? findData.cursor : null;
  const cursored = cursor ? applyCursor(directed, cursor, null) : directed;

  const distincted = distinct ? applyDistinct(cursored, distinct) : cursored;

  const sliced = applySkipTake(distincted, skip, null);

  const first = sliced[0];
  if (!first) return null;

  const applied = applySelectOmit([first], select, omit);
  return applied[0] ?? null;
};

export { findFirstWithRelationOrderBy };
