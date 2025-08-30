import type { DeleteData, DeleteManyReturn } from "../../types/findTypes";
import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { whereFilter } from "../core/whereFilter";

const deleteManyFunc = (
  gassmaControllerUtil: GassmaControllerUtil,
  deleteData: DeleteData
): DeleteManyReturn => {
  const { sheet, startRowNumber } = gassmaControllerUtil;

  const where = deleteData.where;

  const findedData = whereFilter(where, gassmaControllerUtil);
  const findedDataLength = findedData.length;
  let deletedCnt = 0;

  findedData.forEach((row) => {
    sheet.deleteRow(row.rowNumber + startRowNumber + deletedCnt);
    deletedCnt--;
  });

  return { count: findedDataLength };
};

export { deleteManyFunc };
