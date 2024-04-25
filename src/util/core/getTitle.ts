import { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";

const getTitle = (gassmaControllerUtil: GassmaControllerUtil): any[] => {
  const { sheet, startRowNumber, startColumNumber, endColumNumber } =
    gassmaControllerUtil;

  const columLength = endColumNumber - startColumNumber + 1;

  const tiltes = sheet
    .getRange(startRowNumber, startColumNumber, 1, columLength)
    .getValues()[0];

  return tiltes;
};

export { getTitle };
