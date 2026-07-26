import { GassmaClient } from "../../../gassma";
import type { GassmaClientOptions } from "../../../types/relationTypes";

type WriteCall = { method: string; args: unknown[] };

type LoggedSheet = {
  sheet: GoogleAppsScript.Spreadsheet.Sheet;
  snapshot: () => unknown[][];
  writes: WriteCall[];
};

const makeLoggedSheet = (name: string, initial: unknown[][]): LoggedSheet => {
  const data = initial.map((row) => [...row]);
  const writes: WriteCall[] = [];
  const sheet = {
    getName: () => name,
    getLastRow: () => data.length,
    getLastColumn: () => (data[0] ? data[0].length : 0),
    getRange: (row: number, col: number, numRows: number, numCols: number) => ({
      getValues: () =>
        data
          .slice(row - 1, row - 1 + numRows)
          .map((r) => r.slice(col - 1, col - 1 + numCols)),
      setValues: (values: unknown[][]) => {
        writes.push({ method: "setValues", args: [row, col, values] });
        values.forEach((rowValues, i) => {
          while (data.length < row + i) {
            data.push(Array(data[0].length).fill(""));
          }
          rowValues.forEach((value, j) => {
            data[row - 1 + i][col - 1 + j] = value;
          });
        });
      },
    }),
    getDataRange: () => ({ getValues: () => data.map((r) => [...r]) }),
    deleteRow: (rowIndex: number) => {
      writes.push({ method: "deleteRow", args: [rowIndex] });
      data.splice(rowIndex - 1, 1);
    },
  } as any;
  return { sheet, snapshot: () => data.map((r) => [...r]), writes };
};

type TxTestEnvConfig = {
  relations?: boolean;
  cascade?: boolean;
  autoincrement?: boolean;
  waitLockError?: boolean;
};

type TxTestEnv = {
  client: GassmaClient;
  users: LoggedSheet;
  posts: LoggedSheet;
  waitLock: jest.Mock;
  releaseLock: jest.Mock;
  propsStore: Record<string, string>;
};

const buildTxTestEnv = (config?: TxTestEnvConfig): TxTestEnv => {
  const users = makeLoggedSheet("Users", [
    ["id", "name", "age"],
    [1, "Alice", 20],
    [2, "Bob", 30],
  ]);
  const posts = makeLoggedSheet("Posts", [
    ["id", "authorId", "title"],
    [101, 1, "Post A"],
    [102, 2, "Post B"],
  ]);
  const sheets = [users.sheet, posts.sheet];
  const spreadsheet = {
    getId: () => "tx-test",
    getSheets: () => sheets,
    getSheetByName: (n: string) =>
      sheets.find((s: any) => s.getName() === n) ?? null,
  };
  const waitLock = jest.fn(
    config?.waitLockError
      ? () => {
          throw new Error("Lock timeout");
        }
      : () => {},
  );
  const releaseLock = jest.fn();
  const propsStore: Record<string, string> = {};
  Object.assign(globalThis, {
    SpreadsheetApp: { getActiveSpreadsheet: () => spreadsheet },
    LockService: { getScriptLock: () => ({ waitLock, releaseLock }) },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (key: string) => propsStore[key] ?? null,
        setProperty: (key: string, value: string) => {
          propsStore[key] = value;
        },
      }),
    },
  });
  const options: GassmaClientOptions = {};
  if (config?.relations) {
    options.relations = {
      Users: {
        posts: {
          type: "oneToMany",
          to: "Posts",
          field: "id",
          reference: "authorId",
          ...(config?.cascade
            ? { onDelete: "Cascade", onUpdate: "Cascade" }
            : {}),
        },
      },
      Posts: {
        author: {
          type: "manyToOne",
          to: "Users",
          field: "authorId",
          reference: "id",
        },
      },
    };
  }
  if (config?.autoincrement) {
    options.autoincrement = { Users: "id" };
  }
  const client =
    config?.relations || config?.autoincrement
      ? new GassmaClient(options)
      : new GassmaClient();
  return { client, users, posts, waitLock, releaseLock, propsStore };
};

const clearGasGlobals = () => {
  Object.assign(globalThis, {
    SpreadsheetApp: undefined,
    LockService: undefined,
    PropertiesService: undefined,
  });
};

export { buildTxTestEnv, clearGasGlobals, makeLoggedSheet };
export type { LoggedSheet, TxTestEnv };
