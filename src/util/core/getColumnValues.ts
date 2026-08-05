import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { resolveReader } from "../read/sheetReader";
import { getTitle } from "./getTitle";

const getColumnValues = (
  gassmaControllerUtil: GassmaControllerUtil,
  field: string,
): unknown[] | null => {
  const { sheet, startRowNumber, startColumnNumber } = gassmaControllerUtil;

  const columnIndex = getTitle(gassmaControllerUtil).indexOf(field);
  if (columnIndex === -1) return null;

  const reader = resolveReader(gassmaControllerUtil.reader);
  const rowLength = reader.getLastRow(sheet) - startRowNumber;
  if (rowLength <= 0) return [];

  return reader
    .getRangeValues(
      sheet,
      startRowNumber + 1,
      startColumnNumber + columnIndex,
      rowLength,
      1,
    )
    .map((row) => row[0]);
};

export { getColumnValues };
