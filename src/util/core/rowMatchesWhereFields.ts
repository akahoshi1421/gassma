import type {
  FilterConditions,
  GassmaAny,
  WhereUse,
} from "../../types/coreTypes";
import { matchFilterCondition } from "../filterConditions/matchFilterCondition";
import { isDict } from "../other/isDict";
import { isValueEqual } from "../other/isValueEqual";

const rowMatchesWhereFields = (
  row: GassmaAny[],
  where: WhereUse,
  wantFindIndex: number[],
  titles: GassmaAny[],
): boolean => {
  return wantFindIndex.every((i) => {
    const whereOptionContent = where[String(titles[i])];
    if (isDict(whereOptionContent))
      return matchFilterCondition(
        row[i],
        whereOptionContent as FilterConditions,
        row,
        titles,
      );

    const replacedNullWhereOptionContent =
      whereOptionContent === "" ? null : whereOptionContent;
    return isValueEqual(row[i], replacedNullWhereOptionContent);
  });
};

export { rowMatchesWhereFields };
