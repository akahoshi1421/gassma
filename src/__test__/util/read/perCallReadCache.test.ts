import { GassmaClient } from "../../../gassma";
import { GassmaController } from "../../../gassmaController";
import type { RelationsConfig } from "../../../types/relationTypes";
import {
  buildTxTestEnv,
  clearGasGlobals,
  makeLoggedSheet,
} from "../transaction/transactionTestClient";

type CountingSheet = {
  sheet: any;
  readTrips: () => number;
  resetTrips: () => void;
  snapshot: () => unknown[][];
};

const makeCountingSheet = (
  name: string,
  initial: unknown[][],
): CountingSheet => {
  const logged = makeLoggedSheet(name, initial);
  const base: any = logged.sheet;
  let trips = 0;
  const sheet: any = {
    ...base,
    getLastRow: () => {
      trips += 1;
      return base.getLastRow();
    },
    getRange: (row: number, col: number, numRows: number, numCols: number) => {
      const range = base.getRange(row, col, numRows, numCols);
      return {
        ...range,
        getValues: () => {
          trips += 1;
          return range.getValues();
        },
      };
    },
  };
  return {
    sheet,
    readTrips: () => trips,
    resetTrips: () => {
      trips = 0;
    },
    snapshot: logged.snapshot,
  };
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

const buildEnv = (relations: RelationsConfig) => {
  const users = makeCountingSheet("Users", [
    ["id", "name", "parentId"],
    [1, "Alice", ""],
    [2, "Bob", 1],
    [3, "Carol", 1],
  ]);
  const posts = makeCountingSheet("Posts", [
    ["id", "authorId", "title"],
    [101, 1, "Post A"],
    [102, 2, "Post B"],
  ]);
  const sheets = [users.sheet, posts.sheet];
  const spreadsheet: any = {
    getId: () => "read-cache-test",
    getSheets: () => sheets,
    getSheetByName: (n: string) =>
      sheets.find((s: any) => s.getName() === n) ?? null,
  };
  Object.assign(globalThis, {
    SpreadsheetApp: { getActiveSpreadsheet: () => spreadsheet },
  });
  const client = new GassmaClient({ relations });
  users.resetTrips();
  posts.resetTrips();
  return {
    client,
    users,
    posts,
    totalTrips: () => users.readTrips() + posts.readTrips(),
  };
};

const selfRelations: RelationsConfig = {
  Users: {
    posts: {
      type: "oneToMany",
      to: "Posts",
      field: "id",
      reference: "authorId",
    },
    children: {
      type: "oneToMany",
      to: "Users",
      field: "id",
      reference: "parentId",
    },
    parent: {
      type: "manyToOne",
      to: "Users",
      field: "parentId",
      reference: "id",
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

const cascadeRelations: RelationsConfig = {
  Users: {
    posts: {
      type: "oneToMany",
      to: "Posts",
      field: "id",
      reference: "authorId",
      onUpdate: "Cascade",
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

afterEach(() => {
  clearGasGlobals();
});

describe("読み取り専用クエリの往復回数", () => {
  test("findMany({}) はシート1枚につき3往復", () => {
    const env = buildEnv(selfRelations);
    sheetOf(env.client, "Users").findMany({});
    expect(env.totalTrips()).toBe(3);
  });

  test("別シート include はシート2枚で計6往復", () => {
    const env = buildEnv(selfRelations);
    sheetOf(env.client, "Users").findMany({ include: { posts: true } });
    expect(env.totalTrips()).toBe(6);
  });

  test("自己参照 include 1つは3往復", () => {
    const env = buildEnv(selfRelations);
    sheetOf(env.client, "Users").findMany({ include: { children: true } });
    expect(env.totalTrips()).toBe(3);
  });

  test("自己参照 include 2つでも3往復", () => {
    const env = buildEnv(selfRelations);
    sheetOf(env.client, "Users").findMany({
      include: { parent: true, children: true },
    });
    expect(env.totalTrips()).toBe(3);
  });

  test("findFirst は3往復", () => {
    const env = buildEnv(selfRelations);
    sheetOf(env.client, "Users").findFirst({ where: { id: 1 } });
    expect(env.totalTrips()).toBe(3);
  });

  test("count は3往復", () => {
    const env = buildEnv(selfRelations);
    sheetOf(env.client, "Users").count({});
    expect(env.totalTrips()).toBe(3);
  });

  test("aggregate は3往復", () => {
    const env = buildEnv(selfRelations);
    sheetOf(env.client, "Users").aggregate({ _count: { id: true } });
    expect(env.totalTrips()).toBe(3);
  });

  test("groupBy は3往復", () => {
    const env = buildEnv(selfRelations);
    sheetOf(env.client, "Users").groupBy({ by: ["parentId"] });
    expect(env.totalTrips()).toBe(3);
  });

  test("aggregate は _sum/_avg/_max/_min の検証込みでも3往復", () => {
    const env = buildEnv(selfRelations);
    sheetOf(env.client, "Users").aggregate({
      _sum: { id: true },
      _avg: { id: true },
      _max: { id: true },
      _min: { id: true },
      _count: { id: true },
    });
    expect(env.totalTrips()).toBe(3);
  });

  test("groupBy は _sum/_avg/_max/_min の検証込みでも3往復", () => {
    const env = buildEnv(selfRelations);
    sheetOf(env.client, "Users").groupBy({
      by: ["parentId"],
      _sum: { id: true },
      _avg: { id: true },
      _max: { id: true },
      _min: { id: true },
    });
    expect(env.totalTrips()).toBe(3);
  });
});

describe("キャッシュの寿命(トップレベル呼び出しごとに破棄)", () => {
  test("findMany を2回呼ぶと往復は倍になる(呼び出しを跨いで使い回さない)", () => {
    const env = buildEnv(selfRelations);
    const controller = sheetOf(env.client, "Users");
    controller.findMany({});
    const afterFirst = env.totalTrips();
    controller.findMany({});
    expect(env.totalTrips()).toBe(afterFirst * 2);
  });
});

describe("キャッシュ有効時の結果の正しさ", () => {
  test("別シート include の結果は従来と同一", () => {
    const env = buildEnv(selfRelations);
    const result = sheetOf(env.client, "Users").findMany({
      include: { posts: true },
    });
    expect(result).toEqual([
      {
        id: 1,
        name: "Alice",
        parentId: null,
        posts: [{ id: 101, authorId: 1, title: "Post A" }],
      },
      {
        id: 2,
        name: "Bob",
        parentId: 1,
        posts: [{ id: 102, authorId: 2, title: "Post B" }],
      },
      { id: 3, name: "Carol", parentId: 1, posts: [] },
    ]);
  });

  test("自己参照 parent + children の結果は従来と同一", () => {
    const env = buildEnv(selfRelations);
    const result = sheetOf(env.client, "Users").findMany({
      include: { parent: true, children: true },
    });
    expect(result).toEqual([
      {
        id: 1,
        name: "Alice",
        parentId: null,
        parent: null,
        children: [
          { id: 2, name: "Bob", parentId: 1 },
          { id: 3, name: "Carol", parentId: 1 },
        ],
      },
      {
        id: 2,
        name: "Bob",
        parentId: 1,
        parent: { id: 1, name: "Alice", parentId: null },
        children: [],
      },
      {
        id: 3,
        name: "Carol",
        parentId: 1,
        parent: { id: 1, name: "Alice", parentId: null },
        children: [],
      },
    ]);
  });
});

describe("書き込み経路の鮮度(キャッシュを持ち込まない)", () => {
  test("findMany → update → findMany で2回目は新しい値を返す", () => {
    const env = buildEnv(selfRelations);
    const controller = sheetOf(env.client, "Users");

    const before = controller.findMany({ where: { id: 2 } });
    expect(before).toEqual([{ id: 2, name: "Bob", parentId: 1 }]);

    controller.update({ where: { id: 2 }, data: { name: "Bobby" } });

    const after = controller.findMany({ where: { id: 2 } });
    expect(after).toEqual([{ id: 2, name: "Bobby", parentId: 1 }]);
  });

  test("findMany 直後の Cascade update でも子シートが追従し一時値が残らない", () => {
    const env = buildEnv(cascadeRelations);
    const usersController = sheetOf(env.client, "Users");
    const postsController = sheetOf(env.client, "Posts");

    usersController.findMany({ include: { posts: true } });
    usersController.update({ where: { id: 1 }, data: { id: 10 } });

    expect(postsController.findMany({ orderBy: { id: "asc" } })).toEqual([
      { id: 101, authorId: 10, title: "Post A" },
      { id: 102, authorId: 2, title: "Post B" },
    ]);
    expect(usersController.findMany({ orderBy: { id: "asc" } })).toEqual([
      { id: 2, name: "Bob", parentId: 1 },
      { id: 3, name: "Carol", parentId: 1 },
      { id: 10, name: "Alice", parentId: null },
    ]);
    expect(JSON.stringify(env.users.snapshot())).not.toContain(
      "__gassma_cascade",
    );
    expect(JSON.stringify(env.posts.snapshot())).not.toContain(
      "__gassma_cascade",
    );
  });

  test("Cascade update の読みはシートごとのスナップショット読みに集約される", () => {
    const env = buildEnv(cascadeRelations);
    sheetOf(env.client, "Users").update({ where: { id: 1 }, data: { id: 10 } });
    expect(env.totalTrips()).toBe(4);
  });

  test("$transaction 内の findMany → update → findMany で2回目は新しい値を返す", () => {
    const env = buildTxTestEnv();
    const result = env.client.$transaction((tx) => {
      const first = tx.Users.findMany({ where: { id: 1 } });
      tx.Users.update({ where: { id: 1 }, data: { age: 99 } });
      const second = tx.Users.findMany({ where: { id: 1 } });
      return { first, second };
    });

    expect(result.first).toEqual([{ id: 1, name: "Alice", age: 20 }]);
    expect(result.second).toEqual([{ id: 1, name: "Alice", age: 99 }]);
    expect(env.users.snapshot()).toEqual([
      ["id", "name", "age"],
      [1, "Alice", 99],
      [2, "Bob", 30],
    ]);
  });
});
