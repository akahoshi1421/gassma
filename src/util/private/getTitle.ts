import { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";

const getTitleFunc = (gassmaControllerUtil: GassmaControllerUtil): any[] => {
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

  const columLength = endColumNumber - startColumNumber + 1;

  const tiltes = sheet
    .getRange(startRowNumber, startColumNumber, 1, columLength)
    .getValues()[0];

  return tiltes;
};

export { getTitleFunc };
