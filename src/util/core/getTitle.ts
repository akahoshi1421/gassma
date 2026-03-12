import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { mapTitles } from "../map/mapTitles";

const getTitle = (gassmaControllerUtil: GassmaControllerUtil): string[] => {
  const {
    sheet,
    startRowNumber,
    startColumnNumber,
    endColumnNumber,
    fieldMapping,
  } = gassmaControllerUtil;

  const ColumnLength = endColumnNumber - startColumnNumber + 1;

  const tiltes = sheet
    .getRange(startRowNumber, startColumnNumber, 1, ColumnLength)
    .getValues()[0];

  const stringTitles = tiltes.map((title) => String(title));

  if (fieldMapping) {
    return mapTitles(stringTitles, fieldMapping);
  }

  return stringTitles;
};

export { getTitle };
