import type { FindData } from "../../types/findTypes";
import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import type { RelationContext } from "../../types/relationTypes";
import type { OrderBy } from "../../types/coreTypes";
import { findManyFunc } from "./findMany";
import { resolveRelationOrderBy } from "./findUtil/resolveRelationOrderBy";
import { applySelectOmit } from "./findUtil/applySelectOmit";
import { GassmaSkipNegativeError } from "../../errors/find/findError";

const findFirstWithRelationOrderBy = (
  controllerUtil: GassmaControllerUtil,
  findData: FindData,
  relationContext: RelationContext,
  orderByArr: OrderBy[],
): Record<string, unknown> | null => {
  const select = "select" in findData ? findData.select : null;
  const omit = "omit" in findData ? findData.omit : null;
  const skip = "skip" in findData ? findData.skip : null;

  // Step 1: findMany with where only
  const baseRecords = findManyFunc(controllerUtil, {
    where: findData.where,
  });

  // Step 2: skip validation
  if (skip !== null && skip !== undefined && skip < 0) {
    throw new GassmaSkipNegativeError(skip);
  }

  // Step 3: apply skip
  let records = baseRecords;
  if (skip) records = records.slice(skip);

  // Step 4: resolve relation orderBy (sort)
  const sorted = resolveRelationOrderBy(records, orderByArr, relationContext);

  // Step 5: take first
  const first = sorted[0];
  if (!first) return null;

  // Step 6: apply select/omit
  const applied = applySelectOmit([first], select, omit);
  return applied[0] ?? null;
};

export { findFirstWithRelationOrderBy };
