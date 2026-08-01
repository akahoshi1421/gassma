const getWantUpdateIndexFromTitles = (
  titles: string[],
  data: Record<string, unknown>,
): number[] => {
  const wantUpdateKeys = Object.entries(data).map((oneData) => {
    return oneData[0];
  });

  const wantUpdateIndex = wantUpdateKeys.map((key) => {
    return titles.indexOf(key);
  });

  const wantUpdateIndexRemoveMinusOne = wantUpdateIndex.filter(
    (index) => index !== -1,
  );

  return wantUpdateIndexRemoveMinusOne;
};

export { getWantUpdateIndexFromTitles };
