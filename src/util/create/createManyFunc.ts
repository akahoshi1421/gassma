import { CreateData, CreateManyData } from "../../types/createTypes";
import { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { getTitle } from "../core/getTitle";
import { getWantUpdateIndex } from "../core/getWantUpdateIndex";

const createManyFunc = (
  gassmaControllerUtil: GassmaControllerUtil,
  createManyData: CreateManyData
) => {
  const { sheet, startRowNumber, startColumNumber, endColumNumber } =
    gassmaControllerUtil;

  const data = createManyData.data;
  if (data.length === 0) return;

  const titles = getTitle(gassmaControllerUtil);

  const createdDataModel = {
    data: data[0],
  } as CreateData;

  const wantCreateIndex = getWantUpdateIndex(
    gassmaControllerUtil,
    createdDataModel
  ).sort();

  const newData = data.map((row) => {
    return wantCreateIndex.map((index) => {
      return row[String(titles[index])];
    });
  });

  const rowNumber = sheet.getLastRow() + 1;
  const columLength = endColumNumber - startColumNumber + 1;
  const rowLength = newData.length;

  sheet
    .getRange(rowNumber, startColumNumber, rowLength, columLength)
    .setValues(newData);
};

export { createManyFunc };
