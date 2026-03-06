import type { FilterConditions, WhereUse } from "../../types/coreTypes";
import type { FindData } from "../../types/findTypes";
import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import type { HitRowData } from "../../types/hitRowDataType";
import { isLogicMatch } from "../andOrNot/entry";
import { isFilterConditionsMatch } from "../filterConditions/filterConditions";
import { resolveFieldRefs } from "../filterConditions/resolveFieldRefs";
import { isDict } from "../other/isDict";
import { getAllData } from "./getAllData";
import { getTitle } from "./getTitle";
import { getWantFindIndex } from "./getWantFindIndex";

const whereFilter = (
  where: WhereUse,
  gassmaControllerUtil: GassmaControllerUtil,
) => {
  const allDataList = getAllData(gassmaControllerUtil);
  const titles = getTitle(gassmaControllerUtil);

  if (Object.keys(where).length === 0) {
    return allDataList.map((row, index): HitRowData => {
      return {
        rowNumber: index + 1,
        row: row,
      };
    });
  }

  const findData: FindData = {
    where: where,
  };

  const wantFindIndex = getWantFindIndex(gassmaControllerUtil, findData);

  const findedDataIncludeNull = allDataList.map((row, rowNumber) => {
    const matchRow = wantFindIndex.filter((i) => {
      const whereOptionContent = where[String(titles[i])];
      if (isDict(whereOptionContent)) {
        const resolved = resolveFieldRefs(
          whereOptionContent as FilterConditions,
          row,
          titles,
        );
        return isFilterConditionsMatch(row[i], resolved);
      }

      const replacedNullWhereOptionContent =
        whereOptionContent === "" ? null : whereOptionContent;
      return row[i] === replacedNullWhereOptionContent;
    });

    if (matchRow.length === wantFindIndex.length) {
      const hitRowData: HitRowData = { rowNumber: rowNumber + 1, row: row };
      return hitRowData;
    }

    return null;
  });

  const findedData = findedDataIncludeNull.filter((data) => data !== null);

  if (!("OR" in where || "AND" in where || "NOT" in where)) return findedData;

  return isLogicMatch(findedData, where, titles, gassmaControllerUtil);
};

export { whereFilter };
