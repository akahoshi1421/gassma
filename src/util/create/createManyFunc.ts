import { CreateData, CreateManyData } from "../../types/createTypes";
import { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { getTitle } from "../core/getTitle";
import { getWantUpdateIndex } from "../core/getWantUpdateIndex";

const createManyFunc = (
  gassmaControllerUtil: GassmaControllerUtil,
  createManyData: CreateManyData
) => {
  const { sheet, startRowNumber, startColumnNumber, endColumnNumber } =
    gassmaControllerUtil;

  const data = createManyData.data;
  if (data.length === 0) return;

  const titles = getTitle(gassmaControllerUtil);

  const newData = data.map((row) => {
    const createdData = {
      data: row,
    } as CreateData;

    const wantCreateIndex = getWantUpdateIndex(
      gassmaControllerUtil,
      createdData
    );

    return titles.map((_, index) => {
      if (!wantCreateIndex.includes(index)) return "";
      return row[String(titles[index])];
    });
  });

  const rowNumber = sheet.getLastRow() + 1;
  const ColumnLength = endColumnNumber - startColumnNumber + 1;
  const rowLength = newData.length;

  sheet
    .getRange(rowNumber, startColumnNumber, rowLength, ColumnLength)
    .setValues(newData);
};

export { createManyFunc };
