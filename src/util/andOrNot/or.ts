import type { GassmaAny, WhereUse } from "../../types/coreTypes";
import type { HitRowData } from "../../types/hitRowDataType";
import { getWantFindIndexFromTitles } from "../core/getWantFindIndex";
import { rowMatchesWhereFields } from "../core/rowMatchesWhereFields";
import { isLogicMatch } from "./entry";

const isOrMatch = (
  rowsData: HitRowData[],
  whereArray: WhereUse[],
  titles: GassmaAny[],
) => {
  let resultRowsData: HitRowData[] = [];

  whereArray.forEach((where) => {
    const wantFindIndex = getWantFindIndexFromTitles(titles, where);

    let findedData = rowsData.filter((row) =>
      rowMatchesWhereFields(row.row, where, wantFindIndex, titles),
    );

    if ("OR" in where || "AND" in where || "NOT" in where) {
      findedData = isLogicMatch(findedData, where, titles);
    }

    const alreadyHitRowNumbers = new Set(
      resultRowsData.map((row) => row.rowNumber),
    );

    const newInsertedArray = findedData.filter(
      (row) => !alreadyHitRowNumbers.has(row.rowNumber),
    );

    resultRowsData = resultRowsData.concat(newInsertedArray);
  });

  return resultRowsData;
};

export { isOrMatch };
