import type { CreateData } from "../../types/createTypes";
import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { getTitle } from "../core/getTitle";
import { getWantUpdateIndexFromTitles } from "../core/getWantUpdateIndex";
import { escapeFormulaInjectionRow } from "../core/escapeFormulaInjection";
import { unwrapRawCell } from "../raw/raw";
import { validateDataColumns } from "../validate/validateDataColumns";
import { resolveWriter } from "../write/sheetWriter";

const createFunc = (
  gassmaControllerUtil: GassmaControllerUtil,
  createdData: CreateData,
) => {
  const { sheet, startColumnNumber, endColumnNumber } = gassmaControllerUtil;

  const data = createdData.data;
  const titles = getTitle(gassmaControllerUtil);

  if (gassmaControllerUtil.whereValidation) {
    validateDataColumns(
      data,
      titles,
      gassmaControllerUtil.whereValidation,
      "create",
    );
  }

  const wantCreateIndex = getWantUpdateIndexFromTitles(titles, data);

  const createReturn: Record<string, unknown> = {};

  const newData = titles.map((_, index) => {
    if (!wantCreateIndex.includes(index)) {
      createReturn[titles[index]] = null;
      return "";
    }

    createReturn[titles[index]] = unwrapRawCell(data[titles[index]]);
    return data[titles[index]];
  });

  const ColumnLength = endColumnNumber - startColumnNumber + 1;

  resolveWriter(gassmaControllerUtil.writer).appendRows(
    sheet,
    startColumnNumber,
    ColumnLength,
    [escapeFormulaInjectionRow(newData)],
  );

  return createReturn;
};

export { createFunc };
