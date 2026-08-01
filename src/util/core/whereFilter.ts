import type { WhereUse } from "../../types/coreTypes";
import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import type { HitRowData } from "../../types/hitRowDataType";
import { filterRowsByWhere } from "./filterRowsByWhere";
import { getAllData } from "./getAllData";
import { getTitle } from "./getTitle";

const whereFilter = (
  where: WhereUse,
  gassmaControllerUtil: GassmaControllerUtil,
  titles?: string[],
): HitRowData[] => {
  const allDataList = getAllData(gassmaControllerUtil);
  const resolvedTitles = titles ?? getTitle(gassmaControllerUtil);

  return filterRowsByWhere(allDataList, resolvedTitles, where);
};

export { whereFilter };
