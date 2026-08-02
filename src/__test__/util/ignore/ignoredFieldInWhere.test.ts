import { GassmaClient } from "../../../gassma";
import { GassmaController } from "../../../gassmaController";
import { GassmaUnknownArgumentError } from "../../../errors/argument/argumentError";

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

const buildIgnoreClient = (): GassmaClient => {
  const sheets = [
    makeSheet("Users", [
      ["id", "name", "age"],
      [1, "Alice", 20],
      [2, "Bob", 30],
      [3, "Carol", 40],
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
  return new GassmaClient({ ignore: { Users: "age" } });
};

const looseUsers = (): { loose: any; typed: GassmaController } => {
  const client = buildIgnoreClient();
  const record = Object.assign<Record<string, unknown>, GassmaClient>(
    {},
    client,
  );
  const controller = record.Users;
  if (!(controller instanceof GassmaController)) {
    throw new Error("controller not found");
  }
  return { loose: controller, typed: controller };
};

afterEach(() => {
  Object.assign(globalThis, { SpreadsheetApp: undefined });
});

describe("@ignore 列を where に書くとエラー", () => {
  test("findMany: 黙って除去せず unknown argument", () => {
    const { loose } = looseUsers();
    const fn = () => loose.findMany({ where: { age: 20 } });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow("Unknown argument `age`.");
    expect(fn).toThrow("Available: id, name");
  });

  test("deleteMany: 条件が消えて全件削除にならない", () => {
    const { loose, typed } = looseUsers();
    expect(() => loose.deleteMany({ where: { age: 20 } })).toThrow(
      GassmaUnknownArgumentError,
    );
    expect(typed.count({})).toBe(3);
  });

  test("AND の内側の @ignore 列もエラー", () => {
    const { loose } = looseUsers();
    expect(() => loose.findMany({ where: { AND: [{ age: 20 }] } })).toThrow(
      GassmaUnknownArgumentError,
    );
  });

  test("@ignore でない列の where は従来どおり動く", () => {
    const { typed } = looseUsers();
    expect(typed.findMany({ where: { name: "Alice" } })).toEqual([
      { id: 1, name: "Alice" },
    ]);
  });
});
