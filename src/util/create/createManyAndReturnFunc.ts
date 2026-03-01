import type { AnyUse } from "../../types/coreTypes";
import type { CreateData, CreateManyData } from "../../types/createTypes";
import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { getTitle } from "../core/getTitle";
import { getWantUpdateIndex } from "../core/getWantUpdateIndex";

const createManyAndReturnFunc = (
  gassmaControllerUtil: GassmaControllerUtil,
  createManyData: CreateManyData,
): Record<string, unknown>[] => {
  const { sheet, startColumnNumber, endColumnNumber } = gassmaControllerUtil;

  const data = createManyData.data;
  if (data.length === 0) return [];

  const titles = getTitle(gassmaControllerUtil);
  const results: Record<string, unknown>[] = [];

  const newData = data.map((row) => {
    const createdData: CreateData = { data: row };
    const wantCreateIndex = getWantUpdateIndex(
      gassmaControllerUtil,
      createdData,
    );

    const createReturn: AnyUse = {};
    const rowData = titles.map((_, index) => {
      if (!wantCreateIndex.includes(index)) {
        createReturn[titles[index]] = null;
        return "";
      }
      createReturn[titles[index]] = row[String(titles[index])];
      return row[String(titles[index])];
    });

    results.push(createReturn);
    return rowData;
  });

  const rowNumber = sheet.getLastRow() + 1;
  const columnLength = endColumnNumber - startColumnNumber + 1;

  sheet
    .getRange(rowNumber, startColumnNumber, newData.length, columnLength)
    .setValues(newData);

  return results;
};

export { createManyAndReturnFunc };
