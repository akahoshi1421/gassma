import { WhereUse } from "../../types/coreTypes";
import { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { getWantFindIndex } from "../core/getWantFindIndex";
import { isFilterConditionsMatch } from "../filterConditions/filterConditions";
import { isDict } from "../other/isDict";
import { isLogicMatch } from "./entry";

const isAndMatch = (
  rows: any[][],
  whereArray: WhereUse[],
  titles: any[],
  gassmaControllerUtil: GassmaControllerUtil
) => {
  let resultRows: any[][] = rows.concat();

  whereArray.forEach((where) => {
    const wantFindIndex = getWantFindIndex(gassmaControllerUtil, {
      where: where,
    });

    const findedDataIncludeNull = resultRows.map((row) => {
      const matchRow = wantFindIndex.filter((i) => {
        const whereOptionContent = where[String(titles[i])];
        if (isDict(whereOptionContent))
          return isFilterConditionsMatch(row[i], whereOptionContent);

        return row[i] === whereOptionContent;
      });

      if (matchRow.length === wantFindIndex.length) return row;

      return null;
    });

    const findedData = findedDataIncludeNull.filter((data) => data !== null);

    if ("OR" in where || "AND" in where || "NOT" in where) {
      resultRows = isLogicMatch(
        findedData,
        where,
        titles,
        gassmaControllerUtil
      );
      return;
    }

    resultRows = findedData;
  });

  return resultRows;
};

export { isAndMatch };
