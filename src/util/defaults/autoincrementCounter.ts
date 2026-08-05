import { GassmaInvalidValueError } from "../../errors/argument/argumentError";
import {
  GassmaAutoincrementInTransactionError,
  GassmaAutoincrementNotConfiguredError,
} from "../../errors/autoincrement/autoincrementError";
import type { Lock } from "../../types/relationTypes";
import { runWithLock } from "../lock/runWithLock";
import { isTransactionInProgress } from "../transaction/transactionState";
import { buildAutoincrementKey } from "./autoincrementKey";

const LOCK_TIMEOUT_MS = 10000;

type AutoincrementTarget = {
  modelName: string;
  field: string;
  configuredFields: string[] | null;
  keyBase: string;
  lock: Lock | null;
};

const assertNotInTransaction = (methodName: string): void => {
  if (isTransactionInProgress()) {
    throw new GassmaAutoincrementInTransactionError(methodName);
  }
};

const assertConfigured = (target: AutoincrementTarget): void => {
  const configured = target.configuredFields ?? [];
  if (configured.indexOf(target.field) !== -1) return;
  throw new GassmaAutoincrementNotConfiguredError(
    target.modelName,
    String(target.field),
    configured,
  );
};

const assertNextValue = (next: unknown): number => {
  if (
    typeof next !== "number" ||
    !Number.isFinite(next) ||
    Math.floor(next) !== next ||
    next < 1
  ) {
    throw new GassmaInvalidValueError(
      "next",
      "an integer greater than or equal to 1",
    );
  }
  return next;
};

const keyOf = (target: AutoincrementTarget): string =>
  buildAutoincrementKey(target.keyBase, target.field);

const readIssued = (key: string): number =>
  Number(PropertiesService.getScriptProperties().getProperty(key) || 0);

const writeIssued = (key: string, issued: number): void => {
  PropertiesService.getScriptProperties().setProperty(key, String(issued));
};

const maxIssuedIn = (values: unknown[]): number => {
  let max = 0;
  values.forEach((value) => {
    if (typeof value !== "number" || !Number.isFinite(value)) return;
    const floored = Math.floor(value);
    if (floored > max) max = floored;
  });
  return max;
};

const getAutoincrementCounter = (target: AutoincrementTarget): number => {
  assertConfigured(target);
  return readIssued(keyOf(target)) + 1;
};

const setAutoincrementCounter = (
  target: AutoincrementTarget,
  next: unknown,
): void => {
  assertNotInTransaction("$setAutoincrement");
  assertConfigured(target);
  const validated = assertNextValue(next);
  runWithLock(target.lock, LOCK_TIMEOUT_MS, () => {
    writeIssued(keyOf(target), validated - 1);
  });
};

const syncAutoincrementCounter = (
  target: AutoincrementTarget,
  readColumnValues: () => unknown[] | null,
): number => {
  assertNotInTransaction("$syncAutoincrement");
  assertConfigured(target);
  return runWithLock(target.lock, LOCK_TIMEOUT_MS, () => {
    const values = readColumnValues();
    if (values === null) {
      throw new GassmaInvalidValueError(
        "field",
        `a column that exists on \`${target.modelName}\``,
      );
    }
    const issued = maxIssuedIn(values);
    writeIssued(keyOf(target), issued);
    return issued + 1;
  });
};

export {
  getAutoincrementCounter,
  setAutoincrementCounter,
  syncAutoincrementCounter,
};
export type { AutoincrementTarget };
