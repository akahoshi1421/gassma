import { GassmaClient } from "../../../gassma";
import { GassmaController } from "../../../gassmaController";
import type { RelationsConfig } from "../../../types/relationTypes";
import {
  clearGasGlobals,
  makeLoggedSheet,
} from "../transaction/transactionTestClient";

type ObservedSheet = {
  sheet: any;
  snapshot: () => unknown[][];
  trips: () => number;
  multiRowReads: () => number;
  reset: () => void;
};

const makeObservedSheet = (
  name: string,
  initial: unknown[][],
): ObservedSheet => {
  const logged = makeLoggedSheet(name, initial);
  const base: any = logged.sheet;
  let trips = 0;
  let multiRowReads = 0;
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
          if (numRows > 1) multiRowReads += 1;
          return range.getValues();
        },
        setValues: (values: unknown[][]) => {
          trips += 1;
          range.setValues(values);
        },
      };
    },
    deleteRow: (rowIndex: number) => {
      trips += 1;
      base.deleteRow(rowIndex);
    },
    deleteRows: (rowPosition: number, howMany: number) => {
      trips += 1;
      base.deleteRows(rowPosition, howMany);
    },
  };
  return {
    sheet,
    snapshot: logged.snapshot,
    trips: () => trips,
    multiRowReads: () => multiRowReads,
    reset: () => {
      trips = 0;
      multiRowReads = 0;
    },
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

const usersInitial: unknown[][] = [
  ["id", "name", "age"],
  [1, "Alice", 20],
  [2, "Bob", 30],
];

const postsInitial: unknown[][] = [
  ["id", "authorId", "title"],
  [101, 1, "Post A"],
  [102, 2, "Post B"],
];

const commentsInitial: unknown[][] = [
  ["id", "postId", "body"],
  [1001, 101, "C1"],
];

const defaultRelations: RelationsConfig = {
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
};

type Env = {
  client: GassmaClient;
  users: ObservedSheet;
  posts: ObservedSheet;
  comments: ObservedSheet;
};

const buildEnv = (relations: RelationsConfig = defaultRelations): Env => {
  const users = makeObservedSheet("Users", usersInitial);
  const posts = makeObservedSheet("Posts", postsInitial);
  const comments = makeObservedSheet("Comments", commentsInitial);
  const sheets = [users.sheet, posts.sheet, comments.sheet];
  const spreadsheet: any = {
    getId: () => "internal-buffer-test",
    getSheets: () => sheets,
    getSheetByName: (n: string) =>
      sheets.find((s: any) => s.getName() === n) ?? null,
  };
  const propsStore: Record<string, string> = {};
  Object.assign(globalThis, {
    SpreadsheetApp: { getActiveSpreadsheet: () => spreadsheet },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (key: string) => propsStore[key] ?? null,
        setProperty: (key: string, value: string) => {
          propsStore[key] = value;
        },
        deleteProperty: (key: string) => {
          delete propsStore[key];
        },
        getKeys: () => Object.keys(propsStore),
      }),
    },
  });
  const client = new GassmaClient({
    relations,
    lock: {
      waitLock: () => {},
      releaseLock: () => {},
      hasLock: () => false,
    },
  });
  users.reset();
  posts.reset();
  comments.reset();
  return { client, users, posts, comments };
};

const anyData = (value: unknown): any => value;

afterEach(() => {
  clearGasGlobals();
});

describe("nested write のエラー時に1行も書かれない", () => {
  it("子の typo で親 Users も書かれない", () => {
    const env = buildEnv();
    expect(() =>
      sheetOf(env.client, "Users").create({
        data: {
          id: 3,
          name: "Carol",
          age: 40,
          posts: anyData({ create: [{ id: 103, titel: "typo" }] }),
        },
      }),
    ).toThrow();
    expect(env.users.snapshot()).toEqual(usersInitial);
    expect(env.posts.snapshot()).toEqual(postsInitial);
  });

  it("孫(3段ネスト)の typo で親も子も書かれない", () => {
    const env = buildEnv();
    expect(() =>
      sheetOf(env.client, "Users").create({
        data: {
          id: 3,
          name: "Carol",
          age: 40,
          posts: anyData({
            create: [
              {
                id: 103,
                title: "ok",
                comments: { create: [{ id: 1002, bodi: "typo" }] },
              },
            ],
          }),
        },
      }),
    ).toThrow();
    expect(env.users.snapshot()).toEqual(usersInitial);
    expect(env.posts.snapshot()).toEqual(postsInitial);
    expect(env.comments.snapshot()).toEqual(commentsInitial);
  });

  it("connect 先が不在なら親 Users も書かれない", () => {
    const env = buildEnv();
    expect(() =>
      sheetOf(env.client, "Users").create({
        data: {
          id: 3,
          name: "Carol",
          age: 40,
          posts: anyData({ connect: [{ id: 99999 }] }),
        },
      }),
    ).toThrow();
    expect(env.users.snapshot()).toEqual(usersInitial);
    expect(env.posts.snapshot()).toEqual(postsInitial);
  });

  it("update のスカラー + nested 失敗で name も書き換わらない", () => {
    const env = buildEnv();
    expect(() =>
      sheetOf(env.client, "Users").update({
        where: { id: 1 },
        data: {
          name: "Changed",
          age: 99,
          posts: anyData({ connect: [{ id: 102 }, { id: 99999 }] }),
        },
      }),
    ).toThrow();
    expect(env.users.snapshot()).toEqual(usersInitial);
    expect(env.posts.snapshot()).toEqual(postsInitial);
  });

  it("成功時は nested write の結果がシートに反映される", () => {
    const env = buildEnv();
    const result = sheetOf(env.client, "Users").create({
      data: {
        id: 3,
        name: "Carol",
        age: 40,
        posts: anyData({ create: [{ id: 103, title: "ok" }] }),
      },
    });
    expect(result).toEqual({ id: 3, name: "Carol", age: 40 });
    expect(env.users.snapshot()).toEqual([...usersInitial, [3, "Carol", 40]]);
    expect(env.posts.snapshot()).toEqual([...postsInitial, [103, 3, "ok"]]);
  });
});

describe("リレーションが絡まない操作はバッファを通らない", () => {
  it("単純 create は複数行読み(スナップショット)を発生させない", () => {
    const env = buildEnv();
    sheetOf(env.client, "Users").create({
      data: { id: 3, name: "Carol", age: 40 },
    });
    expect(env.users.multiRowReads()).toBe(0);
    expect(env.users.snapshot()).toEqual([...usersInitial, [3, "Carol", 40]]);
  });

  it("cascade しない単純 update の往復回数は従来どおり", () => {
    const env = buildEnv();
    sheetOf(env.client, "Users").update({
      where: { id: 1 },
      data: { name: "Renamed" },
    });
    expect(env.users.snapshot()).toEqual([
      ["id", "name", "age"],
      [1, "Renamed", 20],
      [2, "Bob", 30],
    ]);
    expect(env.users.trips()).toBe(8);
    expect(env.posts.trips()).toBe(0);
  });

  it("cascade を持たないシートの delete の往復回数は従来どおり", () => {
    const env = buildEnv();
    sheetOf(env.client, "Comments").delete({ where: { id: 1001 } });
    expect(env.comments.snapshot()).toEqual([["id", "postId", "body"]]);
    expect(env.comments.trips()).toBe(8);
  });
});

describe("$transaction との相乗り", () => {
  it("tx 内の nested write は tx バッファに乗り、rollback で消える", () => {
    const env = buildEnv();
    expect(() =>
      env.client.$transaction((tx) => {
        const users: any = Object.assign<Record<string, unknown>, object>(
          {},
          tx,
        ).Users;
        users.create({
          data: {
            id: 3,
            name: "Carol",
            age: 40,
            posts: anyData({ create: [{ id: 103, title: "ok" }] }),
          },
        });
        throw new Error("rollback");
      }),
    ).toThrow("rollback");
    expect(env.users.snapshot()).toEqual(usersInitial);
    expect(env.posts.snapshot()).toEqual(postsInitial);
  });

  it("tx 内の nested write は commit で1回だけ書かれる", () => {
    const env = buildEnv();
    env.client.$transaction(
      (tx) => {
        const users: any = Object.assign<Record<string, unknown>, object>(
          {},
          tx,
        ).Users;
        users.create({
          data: {
            id: 3,
            name: "Carol",
            age: 40,
            posts: anyData({ create: [{ id: 103, title: "ok" }] }),
          },
        });
      },
      { rollback: false },
    );
    expect(env.users.snapshot()).toEqual([...usersInitial, [3, "Carol", 40]]);
    expect(env.posts.snapshot()).toEqual([...postsInitial, [103, 3, "ok"]]);
  });
});
