import type { GassmaAny } from "../../types/coreTypes";
import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { resolveReader } from "../read/sheetReader";

const getAllData = (
  gassmaControllerUtil: GassmaControllerUtil,
): GassmaAny[][] => {
  const { sheet, startRowNumber, startColumnNumber, endColumnNumber } =
    gassmaControllerUtil;

  const reader = resolveReader(gassmaControllerUtil.reader);
  const rowLength = reader.getLastRow(sheet) - startRowNumber;
  const ColumnLength = endColumnNumber - startColumnNumber + 1;

  if (rowLength === 0) return [];

  const dataIncludeEmptyString = reader.getRangeValues(
    sheet,
    startRowNumber + 1,
    startColumnNumber,
    rowLength,
    ColumnLength,
  );

  const data = dataIncludeEmptyString.map((row) =>
    row.map((cell) => (cell === "" ? null : cell)),
  );

  return data;
};

export { getAllData };
