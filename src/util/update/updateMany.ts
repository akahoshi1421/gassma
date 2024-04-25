import { UpdateData } from "../../types/findTypes";
import { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { getAllData } from "../core/getAllData";
import { getTitle } from "../core/getTitle";
import { getWantFindIndex } from "../core/getWantFindIndex";
import { getWantUpdateIndex } from "../core/getWantUpdateIndex";

const updateManyFunc = (
  gassmaControllerUtil: GassmaControllerUtil,
  updateData: UpdateData
) => {
  const { sheet, startRowNumber, startColumNumber, endColumNumber } =
    gassmaControllerUtil;

  const where = updateData.where;
  const data = updateData.data;

  const wantFindIndex = getWantFindIndex(gassmaControllerUtil, updateData);
  const wantUpdateIndex = getWantUpdateIndex(gassmaControllerUtil, updateData);

  const allDataList = getAllData(gassmaControllerUtil);
  const titles = getTitle(gassmaControllerUtil);

  allDataList.forEach((row, rowIndex) => {
    const matchRow = wantFindIndex.filter((i) => {
      return row[i] === where[String(titles[i])];
    });

    if (matchRow.length !== wantFindIndex.length) return;

    const updatedRow = row.map((updateData, updateDataIndex) => {
      if (!wantUpdateIndex.includes(updateDataIndex)) return updateData;

      return data[String(titles[updateDataIndex])];
    });

    if (updatedRow.length === 0) return;

    const rowNumber = rowIndex + 1 + startRowNumber;
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
