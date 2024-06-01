const maxSearch = (
  searchedIndex: number,
  preMaxIndexes: number[],
  stringUnicodeArray: number[][]
): number => {
  const nowIndexUnicodeArray = preMaxIndexes.map(
    (num) => stringUnicodeArray[num][searchedIndex]
  );

  let maxNumber = -Infinity;

  nowIndexUnicodeArray.forEach((unicodeNum) => {
    if (maxNumber > unicodeNum) return;

    maxNumber = unicodeNum;
  });

  if (maxNumber === -Infinity) return preMaxIndexes[0];

  const nowMaxIndexes = nowIndexUnicodeArray.filter(
    (unicodeNum) => unicodeNum === maxNumber
  );

  return maxSearch(searchedIndex + 1, nowMaxIndexes, stringUnicodeArray);
};

const getStringMax = (stringArray: string[]) => {
  const numberChagned = stringArray.map((str, index) => {
    return str.split("").map((char) => char.codePointAt(0));
  });

  const indexes = numberChagned.map((_, index) => index);

  const maxIndex = maxSearch(0, indexes, numberChagned);
  return stringArray[maxIndex];
};

export { getStringMax };
