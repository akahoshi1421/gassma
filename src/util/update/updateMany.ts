import { UpdateData } from "../../types/findTypes";
import { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { getTitle } from "../core/getTitle";
import { getWantUpdateIndex } from "../core/getWantUpdateIndex";
import { whereFilter } from "../core/whereFilter";

const updateManyFunc = (
  gassmaControllerUtil: GassmaControllerUtil,
  updateData: UpdateData
) => {
  const { sheet, startRowNumber, startColumNumber, endColumNumber } =
    gassmaControllerUtil;

  const where = updateData.where;
  const data = updateData.data;

  const findedData = whereFilter(where, gassmaControllerUtil);

  const titles = getTitle(gassmaControllerUtil);
  const wantUpdateIndex = getWantUpdateIndex(gassmaControllerUtil, updateData);

  findedData.forEach((row) => {
    const updatedRow = row.row.map((updateData, updateDataIndex) => {
      if (!wantUpdateIndex.includes(updateDataIndex)) return updateData;

      return data[String(titles[updateDataIndex])];
    });

    if (updatedRow.length === 0) return;

    const rowNumber = row.rowNumber + startRowNumber;
    const columLength = endColumNumber - startColumNumber + 1;

    const updateRange = sheet.getRange(
      rowNumber,
      startColumNumber,
      1,
      columLength
    );

    updateRange.setValues([updatedRow]);
  });
};

export { updateManyFunc };
