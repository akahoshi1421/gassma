import type { CreateManyData, CreateManyReturn } from "../../types/createTypes";
import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { getTitle } from "../core/getTitle";
import { getWantUpdateIndexFromTitles } from "../core/getWantUpdateIndex";
import { escapeFormulaInjectionRow } from "../core/escapeFormulaInjection";
import { unwrapRawCell } from "../raw/raw";
import { validateDataColumns } from "../validate/validateDataColumns";
import { validateWritableRow } from "../validate/validateWritableRow";
import { resolveWriter } from "../write/sheetWriter";

type PrepareCreateManyData = (data: CreateManyData) => CreateManyData;

function createManyFunc(
  gassmaControllerUtil: GassmaControllerUtil,
  createManyData: CreateManyData,
  withReturn: true,
  prepareData?: PrepareCreateManyData,
): Record<string, unknown>[];
function createManyFunc(
  gassmaControllerUtil: GassmaControllerUtil,
  createManyData: CreateManyData,
  withReturn?: false,
  prepareData?: PrepareCreateManyData,
): CreateManyReturn;
function createManyFunc(
  gassmaControllerUtil: GassmaControllerUtil,
  createManyData: CreateManyData,
  withReturn?: boolean,
  prepareData?: PrepareCreateManyData,
): Record<string, unknown>[] | CreateManyReturn {
  const { sheet, startColumnNumber, endColumnNumber } = gassmaControllerUtil;

  if (createManyData.data.length === 0) {
    return withReturn ? [] : { count: 0 };
  }

  const titles = getTitle(gassmaControllerUtil);

  const validation = gassmaControllerUtil.whereValidation;
  if (validation) {
    createManyData.data.forEach((row) => {
      validateDataColumns(row, titles, validation, "createMany");
    });
  }

  const data = (prepareData ? prepareData(createManyData) : createManyData)
    .data;

  data.forEach((row) => {
    validateWritableRow(row);
  });

  const newData = data.map((row) => {
    const wantCreateIndex = getWantUpdateIndexFromTitles(titles, row);

    return titles.map((_, index) => {
      if (!wantCreateIndex.includes(index)) return "";
      return row[String(titles[index])];
    });
  });

  const ColumnLength = endColumnNumber - startColumnNumber + 1;

  resolveWriter(gassmaControllerUtil.writer).appendRows(
    sheet,
    startColumnNumber,
    ColumnLength,
    newData.map(escapeFormulaInjectionRow),
  );

  if (withReturn) {
    return data.map((row) =>
      titles.reduce<Record<string, unknown>>((record, title) => {
        record[title] = title in row ? unwrapRawCell(row[title]) : null;
        return record;
      }, {}),
    );
  }

  return { count: data.length };
}

export { createManyFunc };
