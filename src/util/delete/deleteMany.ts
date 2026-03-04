import type { DeleteData, DeleteManyReturn } from "../../types/findTypes";
import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { whereFilter } from "../core/whereFilter";

const deleteManyFunc = (
  gassmaControllerUtil: GassmaControllerUtil,
  deleteData: DeleteData,
): DeleteManyReturn => {
  const { sheet, startRowNumber } = gassmaControllerUtil;

  const where = deleteData.where ?? {};
  const limit = deleteData.limit;

  let findedData = whereFilter(where, gassmaControllerUtil);

  if (limit !== undefined && limit !== null) {
    findedData = findedData.slice(0, limit);
  }

  const findedDataLength = findedData.length;

  // 行を後ろから削除することで、削除による行番号のずれを回避
  // sortDescendingを使って降順にソート
  const sortedData = findedData.sort((a, b) => b.rowNumber - a.rowNumber);

  sortedData.forEach((row) => {
    const actualRowNumber = row.rowNumber + startRowNumber;
    sheet.deleteRow(actualRowNumber);
  });

  return { count: findedDataLength };
};

export { deleteManyFunc };
