import type {
  FilterConditions,
  GassmaAny,
  WhereUse,
} from "../../types/coreTypes";
import type { HitRowData } from "../../types/hitRowDataType";
import { getWantFindIndexFromTitles } from "../core/getWantFindIndex";
import { matchFilterCondition } from "../filterConditions/matchFilterCondition";
import { isDict } from "../other/isDict";
import { isValueEqual } from "../other/isValueEqual";
import { isLogicMatch } from "./entry";

const isAndMatch = (
  rowsData: HitRowData[],
  whereArray: WhereUse[],
  titles: GassmaAny[],
) => {
  let resultRowsData: HitRowData[] = rowsData.concat();

  whereArray.forEach((where) => {
    const wantFindIndex = getWantFindIndexFromTitles(titles, where);

    const findedDataIncludeNull = resultRowsData.map((row) => {
      const matchRow = wantFindIndex.filter((i) => {
        const whereOptionContent = where[String(titles[i])];
        if (isDict(whereOptionContent))
          return matchFilterCondition(
            row.row[i],
            whereOptionContent as FilterConditions,
            row.row,
            titles,
          );

        return isValueEqual(row.row[i], whereOptionContent);
      });

      if (matchRow.length === wantFindIndex.length) return row;

      return null;
    });

    resultRowsData = findedDataIncludeNull.filter((data) => data !== null);

    if ("OR" in where || "AND" in where || "NOT" in where) {
      resultRowsData = isLogicMatch(resultRowsData, where, titles);
    }
  });

  return resultRowsData;
};

export { isAndMatch };
