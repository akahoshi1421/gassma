import { convertToNumber } from "./changeSettingsUtil/convertToNumber";

const changeSettingsFunc = (
  startColumValue: number | string,
  endColumValue: number | string
) => {
  const startColumNumber = convertToNumber(startColumValue);
  const endColumNumber = convertToNumber(endColumValue);

  return { startColumNumber, endColumNumber };
};

export { changeSettingsFunc };
