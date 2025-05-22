import { UpdateData, UpdateManyReturn } from "../../types/findTypes";
import { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { getTitle } from "../core/getTitle";
import { getWantUpdateIndex } from "../core/getWantUpdateIndex";
import { whereFilter } from "../core/whereFilter";
import { updateDataValidation } from "../validation/updateData";

const updateManyFunc = (
  gassmaControllerUtil: GassmaControllerUtil,
  updateData: UpdateData
): UpdateManyReturn => {
  const { sheet, startRowNumber, startColumnNumber, endColumnNumber, schema } =
    gassmaControllerUtil;

  const where = "where" in updateData ? updateData.where : {};
  const data = updateData.data;

  const findedData = whereFilter(where, gassmaControllerUtil);
  const findedDataLength = findedData.length;
  updateDataValidation(data, schema);

  const titles = getTitle(gassmaControllerUtil);
  const wantUpdateIndex = getWantUpdateIndex(gassmaControllerUtil, updateData);

  findedData.forEach((row) => {
    const updatedRow = row.row.map((updateData, updateDataIndex) => {
      if (!wantUpdateIndex.includes(updateDataIndex)) return updateData;

      return data[String(titles[updateDataIndex])];
    });

    if (updatedRow.length === 0) return;

    const rowNumber = row.rowNumber + startRowNumber;
    const ColumnLength = endColumnNumber - startColumnNumber + 1;

    const updateRange = sheet.getRange(
      rowNumber,
      startColumnNumber,
      1,
      ColumnLength
    );

    updateRange.setValues([updatedRow]);
  });

  return { count: findedDataLength };
};

export { updateManyFunc };
