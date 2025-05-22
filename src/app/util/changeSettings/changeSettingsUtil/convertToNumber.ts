import { GassmaInValidColumnValueError } from "../../../errors/changeSettings/changeSettingsError";

const convertToNumber = (ColumnValue: number | string) => {
  if (typeof ColumnValue === "number") return ColumnValue;

  if (!ColumnValue.match(/^([a-z]|[A-Z])+$/))
    throw new GassmaInValidColumnValueError();

  const upperAlphabets = ColumnValue.toUpperCase();
  const alphabetsList = upperAlphabets.split("");

  const resultNumber = alphabetsList.reduce((pre, alphabet, index) => {
    const alphabetNum = alphabet.codePointAt(0) - 64;
    if (index === 0) return pre + alphabetNum;

    return pre + alphabetNum + 25;
  }, 0);

  return resultNumber;
};

export { convertToNumber };
