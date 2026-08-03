import { isDict } from "../other/isDict";
import {
  isIgnoredKey,
  isStructuralKey,
  throwNullArgument,
} from "./nullArgumentPolicy";
import type { ValidatedOperation } from "./validateTopLevelKeys";

type ArgumentShape = "value" | "list" | "cursor" | "deep";

const ARGUMENT_SHAPES: Record<string, ArgumentShape> = {
  orderBy: "value",
  distinct: "list",
  by: "list",
  cursor: "cursor",
  where: "deep",
  having: "deep",
  data: "deep",
  create: "deep",
  update: "deep",
};

const NULL_CHECKED_ARGUMENTS: Partial<Record<ValidatedOperation, string[]>> = {
  findMany: ["where", "orderBy", "cursor", "distinct"],
  findFirst: ["where", "orderBy", "cursor", "distinct"],
  count: ["where", "orderBy", "cursor"],
  aggregate: ["where", "orderBy", "cursor"],
  groupBy: ["by", "where", "having", "orderBy"],
  create: ["data"],
  createMany: ["data"],
  createManyAndReturn: ["data"],
  update: ["where", "data"],
  updateMany: ["where", "data"],
  updateManyAndReturn: ["where", "data"],
  upsert: ["where", "create", "update"],
  delete: ["where"],
  deleteMany: ["where"],
};

const walkNested = (node: Record<string, unknown>): void => {
  Object.entries(node).forEach(([key, value]) => {
    if (isIgnoredKey(key)) return;
    if (value === null) {
      if (isStructuralKey(key)) throwNullArgument(key);
      return;
    }
    if (Array.isArray(value)) {
      walkNestedList(key, value);
      return;
    }
    if (isDict(value)) walkNested(value);
  });
};

const walkNestedList = (key: string, values: unknown[]): void => {
  values.forEach((item) => {
    if (item === null) {
      if (isStructuralKey(key)) throwNullArgument(key);
      return;
    }
    if (isDict(item)) walkNested(item);
  });
};

const rejectNullCursorValues = (cursor: Record<string, unknown>): void => {
  Object.entries(cursor).forEach(([key, value]) => {
    if (value === null) throwNullArgument(key);
  });
};

const validateArgument = (key: string, value: unknown): void => {
  const shape = ARGUMENT_SHAPES[key];
  if (shape === "value") return;
  if (Array.isArray(value)) {
    value.forEach((item) => {
      if (item === null) throwNullArgument(key);
      if (shape === "deep" && isDict(item)) walkNested(item);
    });
    return;
  }
  if (!isDict(value)) return;
  if (shape === "cursor") {
    rejectNullCursorValues(value);
    return;
  }
  if (shape === "deep") walkNested(value);
};

const validateNullArguments = (
  operation: ValidatedOperation,
  input: unknown,
): void => {
  const keys = NULL_CHECKED_ARGUMENTS[operation];
  if (!keys || !isDict(input)) return;

  keys.forEach((key) => {
    const value = input[key];
    if (value === undefined) return;
    if (value === null) throwNullArgument(key);
    validateArgument(key, value);
  });
};

export { validateNullArguments };
