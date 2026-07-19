import type { FindFirstData } from "../../types/findTypes";
import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import type { RelationContext } from "../../types/relationTypes";
import type { OrderBy } from "../../types/coreTypes";
import { findManyFunc } from "./findMany";
import { resolveRelationOrderBy } from "./findUtil/resolveRelationOrderBy";
import { applySelectOmit } from "./findUtil/applySelectOmit";
import { applyCursor } from "./findUtil/applyCursor";

const findFirstWithRelationOrderBy = (
  controllerUtil: GassmaControllerUtil,
  findData: FindFirstData,
  relationContext: RelationContext,
  orderByArr: OrderBy[],
): Record<string, unknown> | null => {
  const select = "select" in findData ? findData.select : null;
  const omit = "omit" in findData ? findData.omit : null;

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

  // Step 3: apply cursor
  const cursor = "cursor" in findData ? findData.cursor : null;
  const cursored = cursor ? applyCursor(sorted, cursor, null) : sorted;

  // Step 4: take first
  const first = cursored[0];
  if (!first) return null;

  // Step 5: apply select/omit
  const applied = applySelectOmit([first], select, omit);
  return applied[0] ?? null;
};

export { findFirstWithRelationOrderBy };
