import { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";

const getAllData = (gassmaControllerUtil: GassmaControllerUtil): any[][] => {
  const { sheet, startRowNumber, startColumNumber, endColumNumber } =
    gassmaControllerUtil;

  const rowLength = sheet.getLastRow() - startRowNumber;
  const columLength = endColumNumber - startColumNumber + 1;

  if (rowLength === 0) return [];

  const data = sheet
    .getRange(startRowNumber + 1, startColumNumber, rowLength, columLength)
    .getValues();

  return data;
};

export { getAllData };
