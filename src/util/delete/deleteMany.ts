import { GassmaLimitNegativeError } from "../../errors/find/findError";
import type { DeleteData, DeleteManyReturn } from "../../types/findTypes";
import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { whereFilter } from "../core/whereFilter";
import { validateFiniteNumberOption } from "../validate/validateFiniteNumberOption";
import { groupDeleteBlocksDescending } from "../write/rowRuns";
import { resolveWriter } from "../write/sheetWriter";

const deleteManyFunc = (
  gassmaControllerUtil: GassmaControllerUtil,
  deleteData: DeleteData,
): DeleteManyReturn => {
  const { sheet, startRowNumber } = gassmaControllerUtil;

  const where = deleteData.where ?? {};
  const limit = deleteData.limit;
  validateFiniteNumberOption("limit", limit);

  let findedData = whereFilter(where, gassmaControllerUtil);

  if (limit !== undefined && limit !== null) {
    if (limit < 0) throw new GassmaLimitNegativeError(limit);
    findedData = findedData.slice(0, limit);
  }

  const findedDataLength = findedData.length;

  // 行を後ろから削除することで、削除による行番号のずれを回避
  // 連続する行はブロックにまとめて 1 コールで削除する
  const actualRowNumbers = findedData.map(
    (row) => row.rowNumber + startRowNumber,
  );

  const writer = resolveWriter(gassmaControllerUtil.writer);
  groupDeleteBlocksDescending(actualRowNumbers).forEach((block) => {
    if (block.howMany === 1) {
      writer.deleteRow(sheet, block.rowPosition);
      return;
    }
    writer.deleteRows(sheet, block.rowPosition, block.howMany);
  });

  return { count: findedDataLength };
};

export { deleteManyFunc };
