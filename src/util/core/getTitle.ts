import { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";

const getTitle = (gassmaControllerUtil: GassmaControllerUtil): string[] => {
  const { sheet, startRowNumber, startColumNumber, endColumNumber } =
    gassmaControllerUtil;

  const columLength = endColumNumber - startColumNumber + 1;

  const tiltes = sheet
    .getRange(startRowNumber, startColumNumber, 1, columLength)
    .getValues()[0];

  const stringTitles = tiltes.map((title) => String(title));

  return stringTitles;
};

export { getTitle };
