import { AnyUse } from "../../types/coreTypes";
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

  const createReturn: AnyUse = {};

  const newData = titles.map((_, index) => {
    if (!wantCreateIndex.includes(index)) {
      createReturn[titles[index]] = null;
      return "";
    }

    createReturn[titles[index]] = data[titles[index]];
    return data[titles[index]];
  });

  const rowNumber = sheet.getLastRow() + 1;
  const ColumnLength = endColumnNumber - startColumnNumber + 1;

  sheet
    .getRange(rowNumber, startColumnNumber, 1, ColumnLength)
    .setValues([newData]);

  return createReturn;
};

export { createFunc };
