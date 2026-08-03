import { GassmaClient } from "../../gassma";
import { GassmaController } from "../../gassmaController";
import { skip } from "../../util/skip/skip";

type MockRange = {
  getValues: () => unknown[][];
  setValues: (values: unknown[][]) => void;
};

const makeSheet = (name: string, initial: unknown[][]) => {
  const data = initial.map((row) => [...row]);
  return {
    getName: () => name,
    getLastRow: () => data.length,
    getLastColumn: () => data[0].length,
    getRange: (
      row: number,
      col: number,
      numRows: number,
      numCols: number,
    ): MockRange => ({
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
    deleteRow: (rowIndex: number) => {
      data.splice(rowIndex - 1, 1);
    },
    deleteRows: (rowPosition: number, howMany: number) => {
      data.splice(rowPosition - 1, howMany);
    },
  };
};

const buildThingsClient = (): GassmaClient => {
  const sheets = [
    makeSheet("Things", [
      ["id", "constructor"],
      [1, "alpha"],
      [2, "beta"],
      [3, "gamma"],
    ]),
  ];
  Object.assign(globalThis, {
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ({
        getId: () => "constructor-column-spreadsheet",
        getSheets: () => sheets,
        getSheetByName: (name: string) =>
          sheets.find((sheet) => sheet.getName() === name) ?? null,
      }),
    },
  });
  return new GassmaClient();
};

const thingsSheet = (): { loose: any; typed: GassmaController } => {
  const client = buildThingsClient();
  const record = Object.assign<Record<string, unknown>, GassmaClient>(
    {},
    client,
  );
  const controller = record.Things;
  if (!(controller instanceof GassmaController)) {
    throw new Error("controller not found: Things");
  }
  return { loose: controller, typed: controller };
};

afterEach(() => {
  Object.assign(globalThis, { SpreadsheetApp: undefined });
});

describe("constructor という名前の列を持つシート", () => {
  test("where のスカラー一致で絞り込める", () => {
    const { loose } = thingsSheet();
    expect(loose.findMany({ where: { constructor: "alpha" } })).toEqual([
      { id: 1, constructor: "alpha" },
    ]);
  });

  test("where のフィルタ演算子が効く", () => {
    const { loose } = thingsSheet();
    expect(
      loose.findMany({ where: { constructor: { contains: "et" } } }),
    ).toEqual([{ id: 2, constructor: "beta" }]);
  });

  test("where の未知列 typo は今まで通り弾かれる", () => {
    const { loose } = thingsSheet();
    expect(() => loose.deleteMany({ where: { constructer: "alpha" } })).toThrow(
      "Unknown argument `constructer`",
    );
    expect(loose.count({})).toBe(3);
  });

  test("AND ブランチ内の未知列 typo も弾かれ deleteMany が誤爆しない", () => {
    const { loose } = thingsSheet();
    expect(() =>
      loose.deleteMany({
        where: { AND: [{ constructor: "alpha", nmae: "zzz" }] },
      }),
    ).toThrow("Unknown argument `nmae`");
    expect(loose.count({})).toBe(3);
  });

  test("where の skip は条件ごと取り除かれる", () => {
    const { loose } = thingsSheet();
    expect(loose.findMany({ where: { constructor: skip } })).toEqual([
      { id: 1, constructor: "alpha" },
      { id: 2, constructor: "beta" },
      { id: 3, constructor: "gamma" },
    ]);
  });

  test("orderBy で並べ替えられる", () => {
    const { loose } = thingsSheet();
    expect(
      loose
        .findMany({ orderBy: { constructor: "desc" } })
        .map((row: any) => row.id),
    ).toEqual([3, 2, 1]);
  });

  test("orderBy の未知の指定は今まで通り弾かれる", () => {
    const { loose } = thingsSheet();
    expect(() =>
      loose.findMany({ orderBy: { constructor: { srot: "asc" } } }),
    ).toThrow("Unknown argument `srot`");
  });

  test("data で書き込める", () => {
    const { loose } = thingsSheet();
    expect(loose.create({ data: { id: 4, constructor: "delta" } })).toEqual({
      id: 4,
      constructor: "delta",
    });
    expect(loose.findMany({ where: { constructor: "delta" } })).toEqual([
      { id: 4, constructor: "delta" },
    ]);
  });

  test("data の未知列 typo は今まで通り弾かれる", () => {
    const { loose } = thingsSheet();
    expect(() =>
      loose.create({ data: { id: 4, constructer: "delta" } }),
    ).toThrow("Unknown argument `constructer`");
    expect(loose.count({})).toBe(3);
  });

  test("update の data で更新できる", () => {
    const { loose } = thingsSheet();
    expect(
      loose.update({ where: { id: 2 }, data: { constructor: "beta2" } }),
    ).toEqual({ id: 2, constructor: "beta2" });
    expect(loose.findFirst({ where: { id: 2 } })).toEqual({
      id: 2,
      constructor: "beta2",
    });
  });

  test("select で列を選べる", () => {
    const { loose } = thingsSheet();
    expect(
      loose.findMany({ where: { id: 1 }, select: { constructor: true } }),
    ).toEqual([{ constructor: "alpha" }]);
  });

  test("AND / NOT の中でも扱える", () => {
    const { loose } = thingsSheet();
    expect(
      loose.findMany({
        where: { AND: [{ constructor: "alpha" }], NOT: { id: 3 } },
      }),
    ).toEqual([{ id: 1, constructor: "alpha" }]);
  });
});
