import { DeleteData } from "../../types/findTypes";
import { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { whereFilter } from "../core/whereFilter";

const deleteManyFunc = (
  gassmaControllerUtil: GassmaControllerUtil,
  deleteData: DeleteData
) => {
  const { sheet, startRowNumber } = gassmaControllerUtil;

  const where = deleteData.where;

  const findedData = whereFilter(where, gassmaControllerUtil);
  let deletedCnt = 0;

  findedData.forEach((row) => {
    sheet.deleteRow(row.rowNumber + startRowNumber + deletedCnt);
    deletedCnt--;
  });
};

export { deleteManyFunc };
