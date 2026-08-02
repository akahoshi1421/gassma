import { GassmaUnknownArgumentError } from "../../errors/argument/argumentError";
import { isDict } from "../other/isDict";

const FIND_KEYS = [
  "where",
  "orderBy",
  "cursor",
  "take",
  "skip",
  "distinct",
  "select",
  "omit",
  "include",
];

const ALLOWED_TOP_LEVEL_KEYS = {
  findMany: FIND_KEYS,
  findFirst: FIND_KEYS,
  count: ["where", "orderBy", "take", "skip", "cursor", "select"],
  aggregate: [
    "where",
    "orderBy",
    "cursor",
    "take",
    "skip",
    "_avg",
    "_count",
    "_max",
    "_min",
    "_sum",
  ],
  groupBy: [
    "by",
    "where",
    "having",
    "orderBy",
    "take",
    "skip",
    "_avg",
    "_count",
    "_max",
    "_min",
    "_sum",
  ],
  create: ["data", "select", "omit", "include"],
  createMany: ["data"],
  createManyAndReturn: ["data", "select", "omit", "include"],
  update: ["where", "data", "select", "omit", "include"],
  updateMany: ["where", "data", "limit"],
  updateManyAndReturn: ["where", "data", "limit", "select", "omit", "include"],
  upsert: ["where", "create", "update", "select", "omit", "include"],
  delete: ["where", "select", "omit", "include"],
  deleteMany: ["where", "limit"],
};

type ValidatedOperation = keyof typeof ALLOWED_TOP_LEVEL_KEYS;

const validateTopLevelKeys = (
  operation: ValidatedOperation,
  input: unknown,
): void => {
  if (!isDict(input)) return;

  const allowed = ALLOWED_TOP_LEVEL_KEYS[operation];
  Object.keys(input).forEach((key) => {
    if (!allowed.includes(key)) {
      throw new GassmaUnknownArgumentError(key, allowed);
    }
  });
};

export { validateTopLevelKeys };
export type { ValidatedOperation };
