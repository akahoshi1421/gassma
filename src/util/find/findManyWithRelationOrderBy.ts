import type { FindData } from "../../types/findTypes";
import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import type { RelationContext } from "../../types/relationTypes";
import { findManyFunc } from "./findMany";
import { resolveRelationOrderBy } from "./findUtil/resolveRelationOrderBy";
import { applySkipTake } from "./findUtil/applySkipTake";
import { applySelectOmit } from "./findUtil/applySelectOmit";
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

  // Step 1: findMany with where + distinct only (no orderBy/skip/take/select/omit)
  const baseRecords = findManyFunc(controllerUtil, {
    where: findData.where,
    distinct: findData.distinct,
  });

  // Step 2: resolve relation orderBy (sort)
  const sorted = resolveRelationOrderBy(
    baseRecords,
    orderByArr,
    relationContext,
  );

  // Step 3: apply skip/take
  const sliced = applySkipTake(sorted, skip, take);

  // Step 4: apply select/omit
  return applySelectOmit(sliced, select, omit);
};

export { findManyWithRelationOrderBy };
