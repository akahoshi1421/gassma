const minSearch = (
  searchedIndex: number,
  preMinIndexes: number[],
  stringUnicodeArray: number[][]
): number => {
  const nowUnicodeArray = preMinIndexes.map(
    (num) => stringUnicodeArray[num][searchedIndex]
  );

  let minNumber = Infinity;

  nowUnicodeArray.forEach((unicodeNum) => {
    if (minNumber > unicodeNum) minNumber = unicodeNum;
  });

  if (minNumber === Infinity) return preMinIndexes[0];

  const nowMinIndexesIncludeNull = nowUnicodeArray.map((unicodeNum, index) => {
    if (unicodeNum !== minNumber) return null;
    return index;
  });

  const nowMinIndexes = nowMinIndexesIncludeNull.filter(
    (nowMin) => nowMin !== null
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
