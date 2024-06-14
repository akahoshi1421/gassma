import { convertToNumber } from "./changeSettingsUtil/convertToNumber";

const changeSettingsFunc = (
  startColumnValue: number | string,
  endColumnValue: number | string
) => {
  const startColumnNumber = convertToNumber(startColumnValue);
  const endColumnNumber = convertToNumber(endColumnValue);

  return { startColumnNumber, endColumnNumber };
};

export { changeSettingsFunc };
