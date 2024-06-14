import { GassmaAny } from "../../types/coreTypes";
import { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";

const getAllData = (
  gassmaControllerUtil: GassmaControllerUtil
): GassmaAny[][] => {
  const { sheet, startRowNumber, startColumnNumber, endColumnNumber } =
    gassmaControllerUtil;

  const rowLength = sheet.getLastRow() - startRowNumber;
  const ColumnLength = endColumnNumber - startColumnNumber + 1;

  if (rowLength === 0) return [];

  const data = sheet
    .getRange(startRowNumber + 1, startColumnNumber, rowLength, ColumnLength)
    .getValues();

  return data;
};

export { getAllData };
