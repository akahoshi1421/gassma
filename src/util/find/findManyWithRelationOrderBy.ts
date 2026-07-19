import type { FindData } from "../../types/findTypes";
import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import type { RelationContext } from "../../types/relationTypes";
import { findManyFunc } from "./findMany";
import { resolveRelationOrderBy } from "./findUtil/resolveRelationOrderBy";
import { applySelectOmit } from "./findUtil/applySelectOmit";
import { applyCursorDistinctSkipTake } from "./findUtil/applyCursorDistinctSkipTake";
import type { OrderBy } from "../../types/coreTypes";

const findManyWithRelationOrderBy = (
  controllerUtil: GassmaControllerUtil,
  findData: FindData,
  relationContext: RelationContext,
  orderByArr: OrderBy[],
): Record<string, unknown>[] => {
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

  // Step 3: Prisma 実測順 (ソート後に cursor → distinct → skip → take)
  const cursor = "cursor" in findData ? findData.cursor : null;
  const paged = applyCursorDistinctSkipTake(
    sorted,
    cursor,
    distinct,
    skip,
    take,
  );

  // Step 4: apply select/omit
  return applySelectOmit(paged, select, omit);
};

export { findManyWithRelationOrderBy };
