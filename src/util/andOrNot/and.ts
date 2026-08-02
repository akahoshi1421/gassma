import type { GassmaAny, WhereUse } from "../../types/coreTypes";
import type { HitRowData } from "../../types/hitRowDataType";
import { getWantFindIndexFromTitles } from "../core/getWantFindIndex";
import { rowMatchesWhereFields } from "../core/rowMatchesWhereFields";
import { isLogicMatch } from "./entry";

const isAndMatch = (
  rowsData: HitRowData[],
  whereArray: WhereUse[],
  titles: GassmaAny[],
) => {
  let resultRowsData: HitRowData[] = rowsData.concat();

  whereArray.forEach((where) => {
    const wantFindIndex = getWantFindIndexFromTitles(titles, where);

    resultRowsData = resultRowsData.filter((row) =>
      rowMatchesWhereFields(row.row, where, wantFindIndex, titles),
    );

    if ("OR" in where || "AND" in where || "NOT" in where) {
      resultRowsData = isLogicMatch(resultRowsData, where, titles);
    }
  });

  return resultRowsData;
};

export { isAndMatch };
