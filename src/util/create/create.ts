import { CreateData } from "../../types/createTypes";
import { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";

const createFunc = (
  gassmaControllerUtil: GassmaControllerUtil,
  createdData: CreateData
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

  const data = createdData.data;
  const titles = getTitle();

  const wantCreateIndex = getWantUpdateIndex(createdData).sort();

  const newData = wantCreateIndex.map((index) => {
    return data[String(titles[index])];
  });

  const rowNumber = sheet.getLastRow() + 1;
  const columLength = endColumNumber - startColumNumber + 1;

  sheet
    .getRange(rowNumber, startColumNumber, 1, columLength)
    .setValues([newData]);
};

export { createFunc };
