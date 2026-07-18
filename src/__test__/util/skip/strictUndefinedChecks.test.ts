import { GassmaClient } from "../../../gassma";
import { GassmaController } from "../../../gassmaController";
import type {
  AnyUse,
  FilterConditions,
  WhereUse,
} from "../../../types/coreTypes";
import type { FindData, FindSelect } from "../../../types/findTypes";
import { skip } from "../../../util/skip/skip";

const inject = <T extends object>(base: T, extra: Record<string, unknown>): T =>
  Object.assign({}, base, extra);

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

const buildClient = (strictUndefinedChecks?: boolean): GassmaClient => {
  const sheets = [
    makeSheet("Users", [
      ["id", "name", "age"],
      [1, "Alice", 20],
      [2, "Bob", 30],
    ]),
    makeSheet("Posts", [
      ["id", "authorId", "title"],
      [101, 1, "Post A"],
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
    },
    strictUndefinedChecks,
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

afterAll(() => {
  Object.assign(globalThis, { SpreadsheetApp: undefined });
});

describe("strictUndefinedChecks 無効（デフォルト）", () => {
  test("where の undefined は従来挙動（何もマッチしない）を維持する", () => {
    const users = sheetOf(buildClient(), "Users");
    expect(users.findMany({ where: { name: undefined } })).toEqual([]);
  });

  test("where の Gassma.skip はフィルタなしとして扱われる", () => {
    const users = sheetOf(buildClient(), "Users");
    expect(
      users.findMany({ where: inject<WhereUse>({}, { name: skip }) }),
    ).toHaveLength(2);
  });

  test("FilterConditions 内の Gassma.skip はその条件だけ省かれる", () => {
    const users = sheetOf(buildClient(), "Users");
    const result = users.findMany({
      where: { age: inject<FilterConditions>({ lte: 25 }, { gte: skip }) },
    });
    expect(result).toEqual([{ id: 1, name: "Alice", age: 20 }]);
  });

  test("update data の Gassma.skip はフィールドを更新しない", () => {
    const users = sheetOf(buildClient(), "Users");
    const result = users.update({
      where: { id: 1 },
      data: { name: skip, age: 21 },
    });
    expect(result).toEqual({ id: 1, name: "Alice", age: 21 });
  });

  test("create data の Gassma.skip はフィールド未指定と同じになる", () => {
    const users = sheetOf(buildClient(), "Users");
    const result = users.create({
      data: inject<AnyUse>({ id: 3, name: "Carol" }, { age: skip }),
    });
    expect(result).toEqual({ id: 3, name: "Carol", age: null });
  });

  test("update data の undefined は従来挙動（値が消える）を維持する", () => {
    const users = sheetOf(buildClient(), "Users");
    users.updateMany({ where: { id: 1 }, data: { name: undefined } });
    const after = users.findFirst({ where: { id: 1 } });
    expect(after).toEqual({ id: 1, age: 20 });
  });

  test("where 全体の Gassma.skip は where 省略と同じになる", () => {
    const users = sheetOf(buildClient(), "Users");
    expect(users.findMany(inject<FindData>({}, { where: skip }))).toHaveLength(
      2,
    );
  });
});

describe("strictUndefinedChecks 有効", () => {
  const strictUsers = () => sheetOf(buildClient(true), "Users");
  const undefinedMessage = (path: string) =>
    `Invalid value for argument \`${path}\`: explicitly \`undefined\` values are not allowed.`;

  test("findMany の where の undefined はエラー", () => {
    expect(() =>
      strictUsers().findMany({ where: { name: undefined } }),
    ).toThrow(undefinedMessage("where.name"));
  });

  test("FilterConditions 内の undefined もエラー", () => {
    expect(() =>
      strictUsers().findMany({ where: { age: { gte: undefined } } }),
    ).toThrow(undefinedMessage("where.age.gte"));
  });

  test("create data の undefined はエラー", () => {
    expect(() =>
      strictUsers().create({ data: { id: 3, name: "Carol", age: undefined } }),
    ).toThrow(undefinedMessage("data.age"));
  });

  test("update / updateMany の data の undefined はエラー", () => {
    expect(() =>
      strictUsers().update({ where: { id: 1 }, data: { name: undefined } }),
    ).toThrow(undefinedMessage("data.name"));
    expect(() =>
      strictUsers().updateMany({ where: { id: 1 }, data: { name: undefined } }),
    ).toThrow(undefinedMessage("data.name"));
  });

  test("upsert の create / update の undefined はエラー", () => {
    expect(() =>
      strictUsers().upsert({
        where: { id: 1 },
        create: { id: 1, name: "Alice", age: undefined },
        update: { age: 22 },
      }),
    ).toThrow(undefinedMessage("create.age"));
  });

  test("deleteMany / count / aggregate / groupBy の where の undefined はエラー", () => {
    expect(() =>
      strictUsers().deleteMany({ where: { id: undefined } }),
    ).toThrow(undefinedMessage("where.id"));
    expect(() => strictUsers().count({ where: { id: undefined } })).toThrow(
      undefinedMessage("where.id"),
    );
    expect(() =>
      strictUsers().aggregate({
        where: { id: undefined },
        _count: { id: true },
      }),
    ).toThrow(undefinedMessage("where.id"));
    expect(() =>
      strictUsers().groupBy({ by: "name", where: { id: undefined } }),
    ).toThrow(undefinedMessage("where.id"));
  });

  test("select の undefined はエラーになり Gassma.skip は省かれる", () => {
    expect(() =>
      strictUsers().findMany({
        where: { id: 1 },
        select: { name: true, age: undefined },
      }),
    ).toThrow(undefinedMessage("select.age"));
    expect(
      strictUsers().findMany({
        where: { id: 1 },
        select: inject<FindSelect>({ name: true }, { age: skip }),
      }),
    ).toEqual([{ name: "Alice" }]);
  });

  test("nested write 内の undefined はエラー、Gassma.skip は操作ごと省かれる", () => {
    expect(() =>
      strictUsers().create({
        data: inject<AnyUse>(
          { id: 3, name: "Carol", age: 25 },
          { posts: { create: { id: 102, title: undefined } } },
        ),
      }),
    ).toThrow(undefinedMessage("data.posts.create.title"));

    const created = strictUsers().create({
      data: inject<AnyUse>({ id: 3, name: "Carol", age: 25 }, { posts: skip }),
    });
    expect(created).toEqual({ id: 3, name: "Carol", age: 25 });
  });

  test("Gassma.skip は有効時もエラーにならず省かれる", () => {
    const users = strictUsers();
    expect(
      users.findMany({ where: inject<WhereUse>({}, { name: skip }) }),
    ).toHaveLength(2);
    const updated = users.update({
      where: { id: 1 },
      data: { name: skip, age: 21 },
    });
    expect(updated).toEqual({ id: 1, name: "Alice", age: 21 });
  });
});
