import type { AnyUse } from "../../types/coreTypes";
import type { CreateData } from "../../types/createTypes";
import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { getTitle } from "../core/getTitle";
import { getWantUpdateIndex } from "../core/getWantUpdateIndex";
import { escapeFormulaInjectionRow } from "../core/escapeFormulaInjection";
import { resolveWriter } from "../write/sheetWriter";

const createFunc = (
  gassmaControllerUtil: GassmaControllerUtil,
  createdData: CreateData,
) => {
  const { sheet, startColumnNumber, endColumnNumber } = gassmaControllerUtil;

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
