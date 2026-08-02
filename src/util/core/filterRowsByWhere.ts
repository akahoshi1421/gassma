import type {
  FilterConditions,
  GassmaAny,
  WhereUse,
} from "../../types/coreTypes";
import type { HitRowData } from "../../types/hitRowDataType";
import { isLogicMatch } from "../andOrNot/entry";
import { matchFilterCondition } from "../filterConditions/matchFilterCondition";
import { isDict } from "../other/isDict";
import { isValueEqual, resetMembershipCache } from "../other/isValueEqual";
import { getWantFindIndexFromTitles } from "./getWantFindIndex";

const filterRowsByWhere = (
  allDataList: GassmaAny[][],
  titles: GassmaAny[],
  where: WhereUse,
): HitRowData[] => {
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
    const matchRow = wantFindIndex.filter((i) => {
      const whereOptionContent = where[String(titles[i])];
      if (isDict(whereOptionContent))
        return matchFilterCondition(
          row[i],
          whereOptionContent as FilterConditions,
          row,
          titles,
        );

      const replacedNullWhereOptionContent =
        whereOptionContent === "" ? null : whereOptionContent;
      return isValueEqual(row[i], replacedNullWhereOptionContent);
    });

    if (matchRow.length === wantFindIndex.length) {
      const hitRowData: HitRowData = { rowNumber: rowNumber + 1, row: row };
      return hitRowData;
    }

    return null;
  });

  const findedData = findedDataIncludeNull.filter((data) => data !== null);

  if (!("OR" in where || "AND" in where || "NOT" in where)) return findedData;

  return isLogicMatch(findedData, where, titles);
};

export { filterRowsByWhere };
