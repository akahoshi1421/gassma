import { GassmaClient } from "../../../gassma";
import type { GassmaClientOptions } from "../../../types/relationTypes";

type WriteCall = { method: string; args: unknown[] };

type SheetMockConfig = {
  formulas?: string[][];
  formulaResults?: Record<string, unknown>;
  failOnWriteCall?: number;
  failOnClearContents?: boolean;
  failOnCopyTo?: boolean;
};

type LoggedSheet = {
  sheet: GoogleAppsScript.Spreadsheet.Sheet;
  snapshot: () => unknown[][];
  formulaSnapshot: () => string[][];
  writes: WriteCall[];
  copyToCallCount: () => number;
  setParent: (spreadsheet: unknown) => void;
};

const makeLoggedSheet = (
  name: string,
  initial: unknown[][],
  config?: SheetMockConfig,
): LoggedSheet => {
  const data = initial.map((row) => [...row]);
  const formulas = initial.map((row, i) =>
    row.map((_, j) => config?.formulas?.[i]?.[j] ?? ""),
  );
  const formulaResults: Record<string, unknown> = {
    ...config?.formulaResults,
  };
  formulas.forEach((row, i) => {
    row.forEach((formula, j) => {
      if (formula !== "" && !(formula in formulaResults)) {
        formulaResults[formula] = data[i][j];
      }
    });
  });
  let sheetName = name;
  let hidden = false;
  let copyToCalls = 0;
  let writeCalls = 0;
  let parent: unknown = null;
  const writes: WriteCall[] = [];
  const width = () => (data[0] ? data[0].length : 0);
  const beginWrite = (method: string, args: unknown[]) => {
    writeCalls += 1;
    if (config?.failOnWriteCall && writeCalls === config.failOnWriteCall) {
      throw new Error(`mock write failure at call ${writeCalls}`);
    }
    writes.push({ method, args });
  };
  const sheet = {
    getName: () => sheetName,
    setName: (newName: string) => {
      sheetName = newName;
    },
    hideSheet: () => {
      hidden = true;
    },
    isSheetHidden: () => hidden,
    getParent: () => parent,
    getLastRow: () => data.length,
    getLastColumn: () => width(),
    getRange: (row: number, col: number, numRows: number, numCols: number) => ({
      getValues: () =>
        data
          .slice(row - 1, row - 1 + numRows)
          .map((r) => r.slice(col - 1, col - 1 + numCols)),
      getFormulas: () =>
        Array.from({ length: numRows }, (_, i) =>
          Array.from(
            { length: numCols },
            (_, j) => formulas[row - 1 + i]?.[col - 1 + j] ?? "",
          ),
        ),
      setValues: (values: unknown[][]) => {
        beginWrite("setValues", [row, col, values]);
        values.forEach((rowValues, i) => {
          while (data.length < row + i) {
            data.push(Array(width()).fill(""));
            formulas.push(Array(width()).fill(""));
          }
          rowValues.forEach((value, j) => {
            const isFormula =
              typeof value === "string" && value.startsWith("=");
            data[row - 1 + i][col - 1 + j] = isFormula
              ? (formulaResults[value] ?? `#MOCK(${value})`)
              : value;
            formulas[row - 1 + i][col - 1 + j] = isFormula ? value : "";
          });
        });
      },
    }),
    getDataRange: () => ({ getValues: () => data.map((r) => [...r]) }),
    deleteRow: (rowIndex: number) => {
      beginWrite("deleteRow", [rowIndex]);
      data.splice(rowIndex - 1, 1);
      formulas.splice(rowIndex - 1, 1);
    },
    deleteRows: (rowPosition: number, howMany: number) => {
      beginWrite("deleteRows", [rowPosition, howMany]);
      data.splice(rowPosition - 1, howMany);
      formulas.splice(rowPosition - 1, howMany);
    },
    clearContents: () => {
      if (config?.failOnClearContents) {
        throw new Error("mock clearContents failure");
      }
      data.splice(0);
      formulas.splice(0);
    },
    copyTo: (target: any) => {
      copyToCalls += 1;
      if (config?.failOnCopyTo) {
        throw new Error("mock copyTo failure");
      }
      const copied = makeLoggedSheet(
        `Copy of ${sheetName}`,
        data.map((r) => [...r]),
        {
          formulas: formulas.map((r) =>
            Array.from({ length: r.length }, (_, j) => r[j] ?? ""),
          ),
          formulaResults,
        },
      );
      copied.setParent(target);
      target._addSheet(copied.sheet);
      return copied.sheet;
    },
  } as any;
  return {
    sheet,
    snapshot: () => data.map((r) => [...r]),
    formulaSnapshot: () =>
      data.map((r, i) =>
        Array.from({ length: r.length }, (_, j) => formulas[i]?.[j] ?? ""),
      ),
    writes,
    copyToCallCount: () => copyToCalls,
    setParent: (spreadsheet: unknown) => {
      parent = spreadsheet;
    },
  };
};

type TxTestEnvConfig = {
  relations?: boolean;
  cascade?: boolean;
  autoincrement?: boolean;
  waitLockError?: boolean;
  noLock?: boolean;
  usersConfig?: SheetMockConfig;
  postsConfig?: SheetMockConfig;
};

type PropsCall = { method: string; key: string; value?: string };

type TxTestEnv = {
  client: GassmaClient;
  users: LoggedSheet;
  posts: LoggedSheet;
  lock: GoogleAppsScript.Lock.Lock;
  waitLock: jest.Mock;
  releaseLock: jest.Mock;
  hasLock: jest.Mock;
  propsStore: Record<string, string>;
  propsLog: PropsCall[];
  spreadsheet: any;
  sheetNames: () => string[];
};

const buildTxTestEnv = (config?: TxTestEnvConfig): TxTestEnv => {
  const users = makeLoggedSheet(
    "Users",
    [
      ["id", "name", "age"],
      [1, "Alice", 20],
      [2, "Bob", 30],
    ],
    config?.usersConfig,
  );
  const posts = makeLoggedSheet(
    "Posts",
    [
      ["id", "authorId", "title"],
      [101, 1, "Post A"],
      [102, 2, "Post B"],
    ],
    config?.postsConfig,
  );
  const sheets = [users.sheet, posts.sheet];
  const spreadsheet: any = {
    getId: () => "tx-test",
    getSheets: () => sheets,
    getSheetByName: (n: string) =>
      sheets.find((s: any) => s.getName() === n) ?? null,
    deleteSheet: (sheet: any) => {
      const index = sheets.indexOf(sheet);
      if (index === -1) {
        throw new Error("mock deleteSheet: sheet not found");
      }
      sheets.splice(index, 1);
    },
    _addSheet: (sheet: any) => {
      sheets.push(sheet);
    },
  };
  users.setParent(spreadsheet);
  posts.setParent(spreadsheet);
  let held = false;
  const waitLock = jest.fn(
    config?.waitLockError
      ? () => {
          throw new Error("Lock timeout");
        }
      : () => {
          held = true;
        },
  );
  const releaseLock = jest.fn(() => {
    held = false;
  });
  const hasLock = jest.fn(() => held);
  const tryLock = jest.fn(() => {
    held = true;
    return true;
  });
  const lock: GoogleAppsScript.Lock.Lock = {
    waitLock,
    releaseLock,
    hasLock,
    tryLock,
  };
  const propsStore: Record<string, string> = {};
  const propsLog: PropsCall[] = [];
  Object.assign(globalThis, {
    SpreadsheetApp: { getActiveSpreadsheet: () => spreadsheet },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (key: string) => propsStore[key] ?? null,
        setProperty: (key: string, value: string) => {
          propsLog.push({ method: "setProperty", key, value });
          propsStore[key] = value;
        },
        deleteProperty: (key: string) => {
          propsLog.push({ method: "deleteProperty", key });
          delete propsStore[key];
        },
        getKeys: () => Object.keys(propsStore),
      }),
    },
  });
  const options: GassmaClientOptions = config?.noLock ? {} : { lock };
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
  const client = new GassmaClient(options);
  return {
    client,
    users,
    posts,
    lock,
    waitLock,
    releaseLock,
    hasLock,
    propsStore,
    propsLog,
    spreadsheet,
    sheetNames: () => sheets.map((s: any) => s.getName()),
  };
};

const clearGasGlobals = () => {
  Object.assign(globalThis, {
    SpreadsheetApp: undefined,
    PropertiesService: undefined,
  });
};

export { buildTxTestEnv, clearGasGlobals, makeLoggedSheet };
export type { LoggedSheet, SheetMockConfig, TxTestEnv };
