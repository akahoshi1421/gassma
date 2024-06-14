import { CreateData } from "../../types/createTypes";
import { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { getTitle } from "../core/getTitle";
import { getWantUpdateIndex } from "../core/getWantUpdateIndex";

const createFunc = (
  gassmaControllerUtil: GassmaControllerUtil,
  createdData: CreateData
) => {
  const { sheet, startRowNumber, startColumnNumber, endColumnNumber } =
    gassmaControllerUtil;

  const data = createdData.data;
  const titles = getTitle(gassmaControllerUtil);

  const wantCreateIndex = getWantUpdateIndex(gassmaControllerUtil, createdData);

  const newData = titles.map((_, index) => {
    if (!wantCreateIndex.includes(index)) return "";
    return data[String(titles[index])];
  });

  const rowNumber = sheet.getLastRow() + 1;
  const ColumnLength = endColumnNumber - startColumnNumber + 1;

  sheet
    .getRange(rowNumber, startColumnNumber, 1, ColumnLength)
    .setValues([newData]);
};

export { createFunc };
