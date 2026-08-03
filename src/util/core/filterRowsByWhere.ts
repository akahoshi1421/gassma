import type { GassmaAny, WhereUse } from "../../types/coreTypes";
import type { HitRowData } from "../../types/hitRowDataType";
import { isLogicMatch } from "../andOrNot/entry";
import { resetMembershipCache } from "../other/isValueEqual";
import { validateQueryValues } from "../validate/validateQueryValues";
import { getWantFindIndexFromTitles } from "./getWantFindIndex";
import { rowMatchesWhereFields } from "./rowMatchesWhereFields";

const filterRowsByWhere = (
  allDataList: GassmaAny[][],
  titles: GassmaAny[],
  where: WhereUse,
): HitRowData[] => {
  validateQueryValues(where);
  resetMembershipCache();
  if (Object.keys(where).length === 0) {
    return allDataList.map((row, index): HitRowData => {
      return {
        rowNumber: index + 1,
        row: row,
      };
    });
  }

  const wantFindIndex = getWantFindIndexFromTitles(titles, where);

  const findedDataIncludeNull = allDataList.map((row, rowNumber) => {
    if (!rowMatchesWhereFields(row, where, wantFindIndex, titles)) return null;

    const hitRowData: HitRowData = { rowNumber: rowNumber + 1, row: row };
    return hitRowData;
  });

  const findedData = findedDataIncludeNull.filter((data) => data !== null);

  if (!("OR" in where || "AND" in where || "NOT" in where)) return findedData;

  return isLogicMatch(findedData, where, titles);
};

export { filterRowsByWhere };
