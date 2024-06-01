const maxSearch = (
  searchedIndex: number,
  preMaxIndexes: number[],
  stringUnicodeArray: number[][]
): number => {
  const nowUnicodeArray = preMaxIndexes.map(
    (num) => stringUnicodeArray[num][searchedIndex]
  );

  let maxNumber = -Infinity;

  nowUnicodeArray.forEach((unicodeNum) => {
    if (maxNumber < unicodeNum) maxNumber = unicodeNum;
  });

  if (maxNumber === -Infinity) return preMaxIndexes[0];

  const nowMaxIndexesIncludeNull = stringUnicodeArray.map(
    (unicodeArray, index) => {
      if (
        unicodeArray[searchedIndex] === maxNumber &&
        preMaxIndexes.includes(index)
      )
        return index;
      return null;
    }
  );

  const nowMaxIndexes = nowMaxIndexesIncludeNull.filter(
    (nowMax) => nowMax !== null
  );

  return maxSearch(searchedIndex + 1, nowMaxIndexes, stringUnicodeArray);
};

const getStringMax = (stringArray: string[]) => {
  const numberChanged = stringArray.map((str) => {
    return str.split("").map((char) => char.codePointAt(0));
  });

  const indexes = numberChanged.map((_, index) => index);

  const maxIndex = maxSearch(0, indexes, numberChanged);
  return stringArray[maxIndex];
};

export { getStringMax };
