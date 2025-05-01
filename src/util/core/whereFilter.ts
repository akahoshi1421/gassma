import { FilterConditions, WhereUse } from "../../types/coreTypes";
import { FindData } from "../../types/findTypes";
import { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { HitRowData } from "../../types/hitRowDataType";
import { isLogicMatch } from "../andOrNot/entry";
import { isFilterConditionsMatch } from "../filterConditions/filterConditions";
import { isDict } from "../other/isDict";
import { otherValidation } from "../validation/other";
import { getAllData } from "./getAllData";
import { getTitle } from "./getTitle";
import { getWantFindIndex } from "./getWantFindIndex";

const whereFilter = (
  where: WhereUse,
  gassmaControllerUtil: GassmaControllerUtil
) => {
  const { schema } = gassmaControllerUtil;

  const allDataList = getAllData(gassmaControllerUtil);
  const titles = getTitle(gassmaControllerUtil);

  if (Object.keys(where).length === 0) {
    return allDataList.map((row, index) => {
      return {
        rowNumber: index + 1,
        row: row,
      } as HitRowData;
    });
  }

  const findData = {
    where: where,
  } as FindData;

  const wantFindIndex = getWantFindIndex(gassmaControllerUtil, findData);

  const findedDataIncludeNull = allDataList.map((row, rowNumber) => {
    const matchRow = wantFindIndex.filter((i) => {
      const whereOptionContent = where[String(titles[i])];
      otherValidation(whereOptionContent as WhereUse, schema);

      if (isDict(whereOptionContent))
        return isFilterConditionsMatch(
          row[i],
          whereOptionContent as FilterConditions
        );

      const replacedNullWhereOptionContent =
        whereOptionContent === "" ? null : whereOptionContent;
      return row[i] === replacedNullWhereOptionContent;
    });

    if (matchRow.length === wantFindIndex.length)
      return { rowNumber: rowNumber + 1, row: row } as HitRowData;

    return null;
  });

  const findedData = findedDataIncludeNull.filter((data) => data !== null);

  if (!("OR" in where || "AND" in where || "NOT" in where)) return findedData;

  return isLogicMatch(findedData, where, titles, gassmaControllerUtil);
};

export { whereFilter };
