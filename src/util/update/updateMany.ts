import { UpdateData } from "../../types/findTypes";
import { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";

const updateManyFunc = (
  gassmaControllerUtil: GassmaControllerUtil,
  updateData: UpdateData
) => {
  const {
    sheet,
    startRowNumber,
    startColumNumber,
    endColumNumber,
    getTitle,
    getWantFindIndex,
    getWantUpdateIndex,
    allData,
  } = gassmaControllerUtil;

  const where = updateData.where;
  const data = updateData.data;

  const wantFindIndex = getWantFindIndex(updateData);
  const wantUpdateIndex = getWantUpdateIndex(updateData);

  const allDataList = allData();
  const titles = getTitle();

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
