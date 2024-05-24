import { WhereUse } from "../../types/coreTypes";
import { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { HitRowData } from "../../types/hitRowDataType";
import { getWantFindIndex } from "../core/getWantFindIndex";
import { isFilterConditionsMatch } from "../filterConditions/filterConditions";
import { isDict } from "../other/isDict";
import { isLogicMatch } from "./entry";

const isAndMatch = (
  rowsData: HitRowData[],
  whereArray: WhereUse[],
  titles: any[],
  gassmaControllerUtil: GassmaControllerUtil
) => {
  let resultRowsData: HitRowData[] = rowsData.concat();

  whereArray.forEach((where, whereArrayIndex) => {
    const wantFindIndex = getWantFindIndex(gassmaControllerUtil, {
      where: where,
    });

    const findedDataIncludeNull = resultRowsData.map((row) => {
      const matchRow = wantFindIndex.filter((i) => {
        const whereOptionContent = where[String(titles[i])];
        if (isDict(whereOptionContent))
          return isFilterConditionsMatch(row.row[i], whereOptionContent);

        return row.row[i] === whereOptionContent;
      });

      if (matchRow.length === wantFindIndex.length) return row;

      return null;
    });

    const findedData = findedDataIncludeNull.filter((data) => data !== null);

    if (whereArrayIndex === 0) {
      resultRowsData = findedData;
      return;
    }

    const alreadyHitRowNumbers = resultRowsData.map((row) => row.rowNumber);

    resultRowsData = findedData.filter((row) =>
      alreadyHitRowNumbers.includes(row.rowNumber)
    );

    if ("OR" in where || "AND" in where || "NOT" in where) {
      const orAndNotRowsData = isLogicMatch(
        findedData,
        where,
        titles,
        gassmaControllerUtil
      );

      const alreadyHitRowNumbers = resultRowsData.map((row) => row.rowNumber);
      resultRowsData = orAndNotRowsData.filter((row) =>
        alreadyHitRowNumbers.includes(row.rowNumber)
      );
    }
  });

  return resultRowsData;
};

export { isAndMatch };
