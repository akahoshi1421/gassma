import type { GassmaAny, WhereUse } from "../../types/coreTypes";

const getWantFindIndexFromTitles = (
  titles: GassmaAny[],
  where: WhereUse,
): number[] => {
  const wantFindKeys = Object.entries(where).map((oneData) => {
    return oneData[0];
  });

  const wantFindIndex = wantFindKeys.map((key) => {
    if (key === "AND" || key === "OR" || key === "NOT") return -1;

    return titles.indexOf(key);
  });

  const wantFindIndexRemovedMinusOne = wantFindIndex.filter(
    (index) => index !== -1,
  );

  return wantFindIndexRemovedMinusOne;
};

export { getWantFindIndexFromTitles };
