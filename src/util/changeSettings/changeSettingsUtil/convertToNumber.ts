import { GassmaInValidColumValueError } from "../../../errors/changeSettings/changeSettingsError";

const convertToNumber = (columValue: number | string) => {
  if (typeof columValue === "number") return columValue;

  if (!columValue.match(/^([a-z]|[A-Z])+$/))
    throw new GassmaInValidColumValueError();

  const upperAlphabets = columValue.toUpperCase();
  const alphabetsList = upperAlphabets.split("");

  const resultNumber = alphabetsList.reduce((pre, alphabet, index) => {
    const alphabetNum = alphabet.codePointAt(0) - 64;
    if (index === 0) return pre + alphabetNum;

    return pre + alphabetNum + 25;
  }, 0);

  return resultNumber;
};

export { convertToNumber };
