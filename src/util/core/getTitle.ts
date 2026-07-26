import type { GassmaControllerUtil } from "../../types/gassmaControllerUtilType";
import { mapTitles } from "../map/mapTitles";
import { resolveReader } from "../read/sheetReader";

const getTitle = (gassmaControllerUtil: GassmaControllerUtil): string[] => {
  const {
    sheet,
    startRowNumber,
    startColumnNumber,
    endColumnNumber,
    fieldMapping,
  } = gassmaControllerUtil;

  const ColumnLength = endColumnNumber - startColumnNumber + 1;

  const tiltes = resolveReader(gassmaControllerUtil.reader).getRangeValues(
    sheet,
    startRowNumber,
    startColumnNumber,
    1,
    ColumnLength,
  )[0];

  const stringTitles = tiltes.map((title) => String(title));

  if (fieldMapping) {
    return mapTitles(stringTitles, fieldMapping);
  }

  return stringTitles;
};

export { getTitle };
