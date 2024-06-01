const minSearch = (
  searchedIndex: number,
  preMinIndexes: number[],
  stringUnicodeArray: number[][]
): number => {
  const nowIndexUnicodeArray = preMinIndexes.map(
    (num) => stringUnicodeArray[num][searchedIndex]
  );

  let minNumber = Infinity;

  nowIndexUnicodeArray.forEach((unicodeNum) => {
    if (minNumber < unicodeNum) return;

    minNumber = unicodeNum;
  });

  if (minNumber === Infinity) return preMinIndexes[0];

  const nowMinIndexes = nowIndexUnicodeArray.filter(
    (unicodeNum) => unicodeNum === minNumber
  );

  return minSearch(searchedIndex + 1, nowMinIndexes, stringUnicodeArray);
};

const getStringMin = (stringArray: string[]) => {
  const numberChanged = stringArray.map((str) => {
    return str.split("").map((char) => char.codePointAt(0));
  });

  const indexes = numberChanged.map((_, index) => index);

  const minIndex = minSearch(0, indexes, numberChanged);
  return stringArray[minIndex];
};

export { getStringMin };
