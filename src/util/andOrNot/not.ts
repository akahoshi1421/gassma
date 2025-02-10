import { FilterConditions, GassmaAny, WhereUse } from "../../types/coreTypes";
import { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { HitRowData } from "../../types/hitRowDataType";
import { getWantFindIndex } from "../core/getWantFindIndex";
import { isFilterConditionsMatch } from "../filterConditions/filterConditions";
import { isDict } from "../other/isDict";
import { isLogicMatch } from "./entry";

const isNotMatch = (
  rowsData: HitRowData[],
  whereArray: WhereUse[],
  titles: GassmaAny[],
  gassmaControllerUtil: GassmaControllerUtil,
  notTrue: boolean // NOTE: {NOT: {NOT: {hoge: "hoge"}}}で反転してくるようにするため
) => {
  let resultRowsData: HitRowData[] = rowsData.concat();

  whereArray.forEach((where) => {
    const wantFindIndex = getWantFindIndex(gassmaControllerUtil, {
      where: where,
    });

    const findedDataIncludeNull = resultRowsData.map((row) => {
      const matchRow = wantFindIndex.filter((i) => {
        const whereOptionContent = where[String(titles[i])];
        if (isDict(whereOptionContent))
          return isFilterConditionsMatch(
            row.row[i],
            whereOptionContent as FilterConditions
          );

        return row.row[i] === whereOptionContent;
      });

      if (matchRow.length === wantFindIndex.length) return notTrue ? null : row;

      return notTrue ? row : null;
    });

    if (wantFindIndex.length !== 0)
      resultRowsData = findedDataIncludeNull.filter((data) => data !== null);

    if ("OR" in where || "AND" in where || "NOT" in where) {
      resultRowsData = isLogicMatch(
        resultRowsData,
        where,
        titles,
        gassmaControllerUtil,
        notTrue
      );
    }
  });

  return resultRowsData;
};

export { isNotMatch };
