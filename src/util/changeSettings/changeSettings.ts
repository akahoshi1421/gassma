import { convertToNumber } from "./changeSettingsUtil/convertToNumber";

const changeSettingsFunc = (
  startColumnValue?: number | string,
  endColumnValue?: number | string
) => {
  const startColumnNumber =
    startColumnValue !== undefined
      ? convertToNumber(startColumnValue)
      : undefined;
  const endColumnNumber =
    endColumnValue !== undefined ? convertToNumber(endColumnValue) : undefined;

  return { startColumnNumber, endColumnNumber };
};

export { changeSettingsFunc };
