import type { GassmaAny, WhereUse } from "../../types/coreTypes";
import type { HitRowData } from "../../types/hitRowDataType";
import { getWantFindIndexFromTitles } from "../core/getWantFindIndex";
import { rowMatchesWhereFields } from "../core/rowMatchesWhereFields";
import { isLogicMatch } from "./entry";
import { isVacuousBranch } from "./vacuousBranch";

const isNotMatch = (
  rowsData: HitRowData[],
  whereArray: WhereUse[],
  titles: GassmaAny[],
) => {
  let matchedRowsData: HitRowData[] = rowsData.concat();
  let hasCondition = false;

  whereArray.forEach((where) => {
    const wantFindIndex = getWantFindIndexFromTitles(titles, where);
    const hasLogicKey = "OR" in where || "AND" in where || "NOT" in where;

    if (wantFindIndex.length === 0 && !hasLogicKey) return;
    if (isVacuousBranch(where)) return;

    hasCondition = true;

    matchedRowsData = matchedRowsData.filter((row) =>
      rowMatchesWhereFields(row.row, where, wantFindIndex, titles),
    );

    if (hasLogicKey) {
      matchedRowsData = isLogicMatch(matchedRowsData, where, titles);
    }
  });

  if (!hasCondition) return rowsData.concat();

  const matchedRowNumbers = new Set(
    matchedRowsData.map((oneRow) => oneRow.rowNumber),
  );

  return rowsData.filter((oneRow) => !matchedRowNumbers.has(oneRow.rowNumber));
};

export { isNotMatch };
