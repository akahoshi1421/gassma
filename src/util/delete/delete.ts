import type { WhereUse } from "../../types/coreTypes";
import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { findFirstFunc } from "../find/findFirst";
import { deleteManyFunc } from "./deleteMany";

const deleteFunc = (
  gassmaControllerUtil: GassmaControllerUtil,
  where: WhereUse,
): Record<string, unknown> | null => {
  const record = findFirstFunc(gassmaControllerUtil, { where });
  if (!record) return null;
  deleteManyFunc(gassmaControllerUtil, { where, limit: 1 });
  return record;
};

export { deleteFunc };
