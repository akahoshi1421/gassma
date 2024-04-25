import { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";

const getAllDataFunc = (
  gassmaControllerUtil: GassmaControllerUtil
): any[][] => {
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

  const rowLength = sheet.getLastRow() - startRowNumber;
  const columLength = endColumNumber - startColumNumber + 1;

  const data = sheet
    .getRange(startRowNumber + 1, startColumNumber, rowLength, columLength)
    .getValues();

  return data;
};

export { getAllDataFunc };
