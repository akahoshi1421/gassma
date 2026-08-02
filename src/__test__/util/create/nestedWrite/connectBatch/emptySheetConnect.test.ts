import { GassmaClient } from "../../../../../gassma";
import { GassmaController } from "../../../../../gassmaController";
import { NestedWriteConnectNotFoundError } from "../../../../../errors/relation/nestedWriteError";
import { GassmaUnknownArgumentError } from "../../../../../errors/argument/argumentError";

const makeSheet = (name: string, initial: unknown[][]) => {
  const data = initial.map((row) => [...row]);
  return {
    getName: () => name,
    getLastRow: () => data.length,
    getLastColumn: () => data[0].length,
    getRange: (row: number, col: number, numRows: number, numCols: number) => ({
      getValues: () =>
        data
          .slice(row - 1, row - 1 + numRows)
          .map((r) => r.slice(col - 1, col - 1 + numCols)),
      setValues: (values: unknown[][]) => {
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
    deleteRow: (rowIndex: number) => {
      data.splice(rowIndex - 1, 1);
    },
    deleteRows: (rowPosition: number, howMany: number) => {
      data.splice(rowPosition - 1, howMany);
    },
  };
};

const buildClientWithEmptyUsers = (): GassmaClient => {
  const sheets = [
    makeSheet("Users", [["id", "name", "age"]]),
    makeSheet("Posts", [["id", "authorId", "title"]]),
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
      },
    },
  });
};

const controllerOf = (client: GassmaClient, name: string): GassmaController => {
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

afterEach(() => {
  Object.assign(globalThis, { SpreadsheetApp: undefined });
});

describe("空シート(0件)への connect / connectOrCreate", () => {
  test("connectOrCreate は空シートでも従来どおり create 側に倒れる", () => {
    const client = buildClientWithEmptyUsers();
    const posts = controllerOf(client, "Posts");
    const users = controllerOf(client, "Users");

    const loosePosts: any = posts;
    const created = loosePosts.create({
      data: {
        id: 201,
        title: "First",
        author: {
          connectOrCreate: {
            where: { id: 1 },
            create: { id: 1, name: "Zoe", age: 5 },
          },
        },
      },
    });

    expect(created).toEqual({ id: 201, authorId: 1, title: "First" });
    expect(users.findMany({})).toEqual([{ id: 1, name: "Zoe", age: 5 }]);
  });

  test("connect は空シートでは従来どおり not found (unknown argument ではない)", () => {
    const client = buildClientWithEmptyUsers();
    const loosePosts: any = controllerOf(client, "Posts");

    const fn = () =>
      loosePosts.create({
        data: {
          id: 202,
          title: "Second",
          author: { connect: { id: 1 } },
        },
      });

    expect(fn).not.toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow(NestedWriteConnectNotFoundError);
  });
});
