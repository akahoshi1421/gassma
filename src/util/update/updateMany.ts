import { GassmaLimitNegativeError } from "../../errors/find/findError";
import type { UpdateData, UpdateManyReturn } from "../../types/findTypes";
import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { escapeFormulaInjectionRow } from "../core/escapeFormulaInjection";
import { getTitle } from "../core/getTitle";
import { getWantUpdateIndexFromTitles } from "../core/getWantUpdateIndex";
import { whereFilter } from "../core/whereFilter";
import { unwrapRawCell } from "../raw/raw";
import { validateDataColumns } from "../validate/validateDataColumns";
import { groupUpdateRuns } from "../write/rowRuns";
import { resolveWriter } from "../write/sheetWriter";
import {
  isNumberOperation,
  resolveNumberOperation,
} from "./resolveNumberOperation";

function updateManyFunc(
  gassmaControllerUtil: GassmaControllerUtil,
  updateData: UpdateData,
  withReturn: true,
): Record<string, unknown>[];
function updateManyFunc(
  gassmaControllerUtil: GassmaControllerUtil,
  updateData: UpdateData,
  withReturn?: false,
): UpdateManyReturn;
function updateManyFunc(
  gassmaControllerUtil: GassmaControllerUtil,
  updateData: UpdateData,
  withReturn?: boolean,
): Record<string, unknown>[] | UpdateManyReturn {
  const { sheet, startRowNumber, startColumnNumber, endColumnNumber } =
    gassmaControllerUtil;

  const where = updateData.where ?? {};
  const data = updateData.data;
  const limit = updateData.limit;

  const titles = getTitle(gassmaControllerUtil);

  if (gassmaControllerUtil.whereValidation) {
    validateDataColumns(
      data,
      titles,
      gassmaControllerUtil.whereValidation,
      "updateMany",
    );
  }

  let findedData = whereFilter(where, gassmaControllerUtil, titles);

  if (limit !== undefined && limit !== null) {
    if (limit < 0) throw new GassmaLimitNegativeError(limit);
    findedData = findedData.slice(0, limit);
  }

  if (findedData.length === 0) {
    return withReturn ? [] : { count: 0 };
  }

  const wantUpdateIndex = getWantUpdateIndexFromTitles(titles, data);
  const ColumnLength = endColumnNumber - startColumnNumber + 1;

  const updates = findedData.map((row) => {
    const updatedRow = row.row.map((cell, cellIndex) => {
      if (!wantUpdateIndex.includes(cellIndex)) return cell;
      const value = data[String(titles[cellIndex])];
      if (isNumberOperation(value)) {
        return resolveNumberOperation(cell, value);
      }
      return value;
    });

    return { rowNumber: row.rowNumber + startRowNumber, updatedRow };
  });

  const writeEntries = updates
    .filter((update) => update.updatedRow.length > 0)
    .map((update) => ({
      rowNumber: update.rowNumber,
      row: escapeFormulaInjectionRow(update.updatedRow),
    }));

  const writer = resolveWriter(gassmaControllerUtil.writer);
  groupUpdateRuns(writeEntries).forEach((run) => {
    if (run.rows.length === 1) {
      writer.updateRow(
        sheet,
        run.startRowNumber,
        startColumnNumber,
        ColumnLength,
        run.rows[0],
      );
      return;
    }
    writer.updateRows(
      sheet,
      run.startRowNumber,
      startColumnNumber,
      ColumnLength,
      run.rows,
    );
  });

  const records = updates.map(({ updatedRow }) =>
    titles.reduce<Record<string, unknown>>((record, title, index) => {
      record[title] = unwrapRawCell(updatedRow[index]);
      return record;
    }, {}),
  );

  return withReturn ? records : { count: findedData.length };
}

export { updateManyFunc };
