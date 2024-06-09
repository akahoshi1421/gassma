import { FilterConditions, GassmaAny, WhereUse } from "../../types/coreTypes";
import { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { HitRowData } from "../../types/hitRowDataType";
import { getWantFindIndex } from "../core/getWantFindIndex";
import { isFilterConditionsMatch } from "../filterConditions/filterConditions";
import { isDict } from "../other/isDict";
import { isLogicMatch } from "./entry";

const isOrMatch = (
  rowsData: HitRowData[],
  whereArray: WhereUse[],
  titles: GassmaAny[],
  gassmaControllerUtil: GassmaControllerUtil
) => {
  let resultRowsData: HitRowData[] = rowsData.concat();

  whereArray.forEach((where, whereArrayIndex) => {
    const wantFindIndex = getWantFindIndex(gassmaControllerUtil, {
      where: where,
    });

    const findedDataIncludeNull = rowsData.map((row) => {
      const matchRow = wantFindIndex.filter((i) => {
        const whereOptionContent = where[String(titles[i])];
        if (isDict(whereOptionContent))
          return isFilterConditionsMatch(
            row.row[i],
            whereOptionContent as FilterConditions
          );

        return row.row[i] === whereOptionContent;
      });

      if (matchRow.length === wantFindIndex.length) return row;

      return null;
    });

    let findedData = findedDataIncludeNull.filter((data) => data !== null);

    if ("OR" in where || "AND" in where || "NOT" in where) {
      findedData = isLogicMatch(
        findedData,
        where,
        titles,
        gassmaControllerUtil
      );
    }

    if (whereArrayIndex === 0) {
      resultRowsData = findedData;
      return;
    }

    const alreadyHitRowNumbers = resultRowsData.map((row) => row.rowNumber);

    const newInsertedArray = findedData.filter(
      (row) => !alreadyHitRowNumbers.includes(row.rowNumber)
    );

    resultRowsData = resultRowsData.concat(newInsertedArray);
  });
  return resultRowsData;
};

export { isOrMatch };
