import { GassmaClient } from "../../../gassma";
import { GassmaController } from "../../../gassmaController";

type MockRange = {
  getValues: () => unknown[][];
  setValues: (values: unknown[][]) => void;
};

type MockSheet = {
  getName: () => string;
  getLastRow: () => number;
  getLastColumn: () => number;
  getRange: (
    row: number,
    col: number,
    numRows: number,
    numCols: number,
  ) => MockRange;
  getDataRange: () => { getValues: () => unknown[][] };
  deleteRow: (rowIndex: number) => void;
};

const makeSheet = (name: string, initial: unknown[][]): MockSheet => {
  const data = initial.map((row) => [...row]);
  return {
    getName: () => name,
    getLastRow: () => data.length,
    getLastColumn: () => data[0].length,
    getRange: (row, col, numRows, numCols) => ({
      getValues: () =>
        data
          .slice(row - 1, row - 1 + numRows)
          .map((r) => r.slice(col - 1, col - 1 + numCols)),
      setValues: (values) => {
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
    getDataRange: () => ({ getValues: () => data }),
    deleteRow: (rowIndex) => {
      data.splice(rowIndex - 1, 1);
    },
  };
};

const buildTestClient = (options?: { relations?: boolean }): GassmaClient => {
  const sheets = [
    makeSheet("Users", [
      ["id", "name", "age"],
      [1, "Alice", 20],
      [2, "Bob", 30],
      [3, "Carol", 40],
    ]),
    makeSheet("Posts", [
      ["id", "authorId", "title"],
      [101, 1, "Post A"],
      [102, 2, "Post B"],
    ]),
    makeSheet("Comments", [
      ["id", "postId", "body"],
      [1001, 101, "Hello world"],
      [1002, 101, "Nice post"],
      [1003, 102, "Great read"],
    ]),
  ];
  const mockSpreadsheet = {
    getId: () => "test-spreadsheet",
    getSheets: () => sheets,
    getSheetByName: (name: string) =>
      sheets.find((sheet) => sheet.getName() === name) ?? null,
  };
  Object.assign(globalThis, {
    SpreadsheetApp: { getActiveSpreadsheet: () => mockSpreadsheet },
  });
  if (!options?.relations) return new GassmaClient();
  return new GassmaClient({
    relations: {
      Users: {
        posts: {
          type: "oneToMany",
          to: "Posts",
          field: "id",
          reference: "authorId",
        },
      },
      Posts: {
        author: {
          type: "manyToOne",
          to: "Users",
          field: "authorId",
          reference: "id",
        },
        comments: {
          type: "oneToMany",
          to: "Comments",
          field: "id",
          reference: "postId",
        },
      },
      Comments: {
        post: {
          type: "manyToOne",
          to: "Posts",
          field: "postId",
          reference: "id",
        },
      },
    },
  });
};

const sheetOf = (client: GassmaClient, name: string): GassmaController => {
  const record = Object.assign<Record<string, unknown>, GassmaClient>(
    {},
    client,
  );
  const controller = record[name];
  if (!(controller instanceof GassmaController)) {
    throw new Error(`controller not found: ${name}`);
  }
  return controller;
};

const clearSpreadsheetApp = () => {
  Object.assign(globalThis, { SpreadsheetApp: undefined });
};

export { buildTestClient, clearSpreadsheetApp, sheetOf };
