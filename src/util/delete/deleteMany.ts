import { DeleteData } from "../../types/findTypes";
import { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { getAllData } from "../core/getAllData";
import { getTitle } from "../core/getTitle";
import { getWantFindIndex } from "../core/getWantFindIndex";
import { isFilterConditionsMatch } from "../filterConditions/filterConditions";
import { isDict } from "../other/isDict";

const deleteManyFunc = (
  gassmaControllerUtil: GassmaControllerUtil,
  deleteData: DeleteData
) => {
  const { sheet, startRowNumber } = gassmaControllerUtil;

  const where = deleteData.where;

  const wantFindIndex = getWantFindIndex(gassmaControllerUtil, deleteData);

  const allDataList = getAllData(gassmaControllerUtil);
  const titles = getTitle(gassmaControllerUtil);

  let deletedCnt = 0;

  allDataList.forEach((row, rowIndex) => {
    const matchRow = wantFindIndex.filter((i) => {
      const whereOptionContent = where[String(titles[i])];
      if (isDict(whereOptionContent))
        return isFilterConditionsMatch(row[i], whereOptionContent);

      return row[i] === whereOptionContent;
    });

    if (matchRow.length !== wantFindIndex.length) return;

    sheet.deleteRow(rowIndex + 1 + startRowNumber + deletedCnt);
    deletedCnt--;
  });
};

export { deleteManyFunc };
