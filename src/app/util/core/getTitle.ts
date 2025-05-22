import { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";

const getTitle = (gassmaControllerUtil: GassmaControllerUtil): string[] => {
  const { sheet, startRowNumber, startColumnNumber, endColumnNumber } =
    gassmaControllerUtil;

  const ColumnLength = endColumnNumber - startColumnNumber + 1;

  const tiltes = sheet
    .getRange(startRowNumber, startColumnNumber, 1, ColumnLength)
    .getValues()[0];

  const stringTitles = tiltes.map((title) => String(title));

  return stringTitles;
};

export { getTitle };
