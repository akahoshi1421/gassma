import { DeleteData } from "../../types/findTypes";
import { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";

const deleteManyFunc = (
  gassmaControllerUtil: GassmaControllerUtil,
  deleteData: DeleteData
) => {
  const {
    sheet,
    startRowNumber,
    startColumNumber,
    endColumNumber,
    getTitle,
    getWantFindIndex,
    getWantUpdateIndex,
    allData,
  } = gassmaControllerUtil;

  const where = deleteData.where;

  const wantFindIndex = getWantFindIndex(deleteData);

  const allDataList = allData();
  const titles = getTitle();

  let deletedCnt = 0;

  allDataList.forEach((row, rowIndex) => {
    const matchRow = wantFindIndex.filter((i) => {
      return row[i] === where[String(titles[i])];
    });

    if (matchRow.length !== wantFindIndex.length) return;

    sheet.deleteRow(rowIndex + 1 + startRowNumber + deletedCnt);
    deletedCnt--;
  });
};

export { deleteManyFunc };
