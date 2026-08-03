import { GassmaInvalidValueError } from "../../errors/argument/argumentError";

// Prisma 実測: 構造を受け取るキーの null は "Argument must not be null" エラー。
// 値を受け取る位置(equals / not / is / isNot / 列名そのもの)の null は
// "NULL と等しい" という正当な意味なのでここには載せない。
const EXPECTED_BY_KEY: Record<string, string> = {
  where: "an object",
  having: "an object",
  cursor: "an object",
  orderBy: "an object or an array",
  distinct: "a field name or an array of field names",
  by: "a field name or an array of field names",
  data: "an object or an array",
  AND: "an object or an array",
  OR: "an object or an array",
  NOT: "an object or an array",
  some: "an object",
  every: "an object",
  none: "an object",
  contains: "a string",
  startsWith: "a string",
  endsWith: "a string",
  gt: "a comparable value",
  gte: "a comparable value",
  lt: "a comparable value",
  lte: "a comparable value",
  increment: "a number",
  decrement: "a number",
  multiply: "a number",
  divide: "a number",
  create: "an object or an array",
  createMany: "an object",
  connect: "an object or an array",
  connectOrCreate: "an object or an array",
  set: "an object or an array",
  disconnect: "a boolean or an object",
  delete: "a boolean or an object",
  update: "an object or an array",
  deleteMany: "an object or an array",
  updateMany: "an object or an array",
};

const STRUCTURAL_KEYS = new Set(Object.keys(EXPECTED_BY_KEY));

// in / notIn の null は nullable 列に対する正当な意味を持つため対象外
const IGNORED_KEYS = new Set(["in", "notIn"]);

const throwNullArgument = (key: string): never => {
  const expected = EXPECTED_BY_KEY[key] ?? "a scalar value";
  throw new GassmaInvalidValueError(key, `${expected}, but received null`);
};

const isStructuralKey = (key: string): boolean => STRUCTURAL_KEYS.has(key);

const isIgnoredKey = (key: string): boolean => IGNORED_KEYS.has(key);

export { isIgnoredKey, isStructuralKey, throwNullArgument };
