import type {
  CreateData,
  CreateManyData,
  CreateManyReturn,
} from "../../types/createTypes";
import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { getTitle } from "../core/getTitle";
import { getWantUpdateIndex } from "../core/getWantUpdateIndex";
import { escapeFormulaInjectionRow } from "../core/escapeFormulaInjection";

function createManyFunc(
  gassmaControllerUtil: GassmaControllerUtil,
  createManyData: CreateManyData,
  withReturn: true,
): Record<string, unknown>[];
function createManyFunc(
  gassmaControllerUtil: GassmaControllerUtil,
  createManyData: CreateManyData,
  withReturn?: false,
): CreateManyReturn;
function createManyFunc(
  gassmaControllerUtil: GassmaControllerUtil,
  createManyData: CreateManyData,
  withReturn?: boolean,
): Record<string, unknown>[] | CreateManyReturn {
  const { sheet, startColumnNumber, endColumnNumber } = gassmaControllerUtil;

  const data = createManyData.data;
  if (data.length === 0) {
    return withReturn ? [] : { count: 0 };
  }

  const titles = getTitle(gassmaControllerUtil);

  const newData = data.map((row) => {
    const createdData: CreateData = { data: row };
    const wantCreateIndex = getWantUpdateIndex(
      gassmaControllerUtil,
      createdData,
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
    .setValues(newData.map(escapeFormulaInjectionRow));

  if (withReturn) {
    return data.map((row) =>
      titles.reduce<Record<string, unknown>>((record, title) => {
        record[title] = title in row ? row[title] : null;
        return record;
      }, {}),
    );
  }

  return { count: data.length };
}

export { createManyFunc };
