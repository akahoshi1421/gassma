import type { UpdateData, UpdateManyReturn } from "../../types/findTypes";
import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { getTitle } from "../core/getTitle";
import { getWantUpdateIndex } from "../core/getWantUpdateIndex";
import { whereFilter } from "../core/whereFilter";
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

  const where = "where" in updateData ? updateData.where : {};
  const data = updateData.data;

  const findedData = whereFilter(where, gassmaControllerUtil);

  if (findedData.length === 0) {
    return withReturn ? [] : { count: 0 };
  }

  const titles = getTitle(gassmaControllerUtil);
  const wantUpdateIndex = getWantUpdateIndex(gassmaControllerUtil, updateData);
  const ColumnLength = endColumnNumber - startColumnNumber + 1;

  const records = findedData.map((row) => {
    const updatedRow = row.row.map((cell, cellIndex) => {
      if (!wantUpdateIndex.includes(cellIndex)) return cell;
      const value = data[String(titles[cellIndex])];
      if (isNumberOperation(value)) {
        return resolveNumberOperation(cell, value);
      }
      return value;
    });

    if (updatedRow.length > 0) {
      const rowNumber = row.rowNumber + startRowNumber;
      const updateRange = sheet.getRange(
        rowNumber,
        startColumnNumber,
        1,
        ColumnLength,
      );
      updateRange.setValues([updatedRow]);
    }

    return titles.reduce<Record<string, unknown>>((record, title, index) => {
      record[title] = updatedRow[index];
      return record;
    }, {});
  });

  return withReturn ? records : { count: findedData.length };
}

export { updateManyFunc };
