import type { WhereUse } from "../../types/coreTypes";
import { isDict } from "../other/isDict";

// Prisma 実測(2026-08-03, prisma-test/vacuousProbe.ts, emptyLiteralProbe.ts):
// (1) 条件を1つも生成しないブランチは AND/OR/NOT の配列から取り除かれる
// (2) 空になった OR は恒偽、空の AND/NOT は恒真
// AND/NOT/OR とも空配列・全ブランチ条件ゼロは条件ゼロとして再帰的に扱う。
// OR の単体 dict 形は配列必須エラーの対象なので条件ゼロにしない(Prisma も同様にエラー)
const isVacuousLogicValue = (value: unknown): boolean => {
  if (Array.isArray(value))
    return value.every((branch) => isDict(branch) && isVacuousBranch(branch));
  if (isDict(value)) return isVacuousBranch(value);
  return false;
};

const isVacuousBranch = (where: WhereUse): boolean =>
  Object.keys(where).every((key) => {
    const value = where[key];
    if (key === "OR") return Array.isArray(value) && isVacuousLogicValue(value);
    if (key === "AND" || key === "NOT") return isVacuousLogicValue(value);
    return isDict(value) && Object.keys(value).length === 0;
  });

export { isVacuousBranch };
