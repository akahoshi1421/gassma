import {
  GassmaInvalidValueError,
  GassmaUnknownArgumentError,
} from "../../errors/argument/argumentError";
import { buildTestClient, sheetOf } from "./extends/extendsTestClient";
import {
  buildTxTestEnv,
  clearGasGlobals,
} from "./transaction/transactionTestClient";

afterEach(() => {
  clearGasGlobals();
});

const looseUsers = (options?: {
  relations?: boolean;
}): { loose: any; typed: ReturnType<typeof sheetOf> } => {
  const typed = sheetOf(buildTestClient(options), "Users");
  const loose: any = typed;
  return { loose, typed };
};

const loosePosts = (): { loose: any; typed: ReturnType<typeof sheetOf> } => {
  const typed = sheetOf(buildTestClient({ relations: true }), "Posts");
  const loose: any = typed;
  return { loose, typed };
};

const aliceUnchanged = (typed: ReturnType<typeof sheetOf>) => {
  expect(typed.findFirst({ where: { id: 1 } })).toEqual({
    id: 1,
    name: "Alice",
    age: 20,
  });
};

describe("data の列名 typo で書き込みが誤爆しない", () => {
  test("create: nmae はサジェスト付きエラーになり空行が追加されない", () => {
    const { loose, typed } = looseUsers();
    const fn = () => loose.create({ data: { id: 9, nmae: "Zed", age: 1 } });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow(
      "Unknown argument `nmae`. Did you mean `name`?\n\nAvailable: id, name, age",
    );
    expect(typed.count({})).toBe(3);
  });

  test("create: relations ありなら Available にリレーション名も並ぶ", () => {
    const { loose, typed } = looseUsers({ relations: true });
    expect(() =>
      loose.create({ data: { id: 9, nmae: "Zed", age: 1 } }),
    ).toThrow("Available: id, name, age, posts");
    expect(typed.count({})).toBe(3);
  });

  test("createMany: 2行目の typo もエラーになり1行も追加されない", () => {
    const { loose, typed } = looseUsers();
    expect(() =>
      loose.createMany({
        data: [
          { id: 8, name: "Yui", age: 2 },
          { id: 9, nmae: "Zed", age: 1 },
        ],
      }),
    ).toThrow(GassmaUnknownArgumentError);
    expect(typed.count({})).toBe(3);
  });

  test("createManyAndReturn: typo はエラーになり追加されない", () => {
    const { loose, typed } = looseUsers();
    expect(() =>
      loose.createManyAndReturn({ data: [{ id: 9, nmae: "Zed", age: 1 }] }),
    ).toThrow(GassmaUnknownArgumentError);
    expect(typed.count({})).toBe(3);
  });

  test("updateMany: 未知列はエラーになり count だけ返る no-op にならない", () => {
    const { loose, typed } = looseUsers();
    expect(() =>
      loose.updateMany({ where: { age: { gte: 0 } }, data: { 住処: "Kobe" } }),
    ).toThrow(GassmaUnknownArgumentError);
    aliceUnchanged(typed);
  });

  test("update: 未知列はエラーになり行が更新されない", () => {
    const { loose, typed } = looseUsers();
    expect(() =>
      loose.update({ where: { id: 1 }, data: { nmae: "X" } }),
    ).toThrow(GassmaUnknownArgumentError);
    aliceUnchanged(typed);
  });

  test("upsert(更新分岐): update 側の typo はエラーになり更新されない", () => {
    const { loose, typed } = looseUsers();
    expect(() =>
      loose.upsert({
        where: { id: 1 },
        create: { id: 1, name: "Alice", age: 20 },
        update: { nmae: "X" },
      }),
    ).toThrow(GassmaUnknownArgumentError);
    aliceUnchanged(typed);
  });

  test("upsert(作成分岐): create 側の typo はエラーになり追加されない", () => {
    const { loose, typed } = looseUsers();
    expect(() =>
      loose.upsert({
        where: { id: 99 },
        create: { id: 99, nmae: "Zed", age: 1 },
        update: { name: "X" },
      }),
    ).toThrow(GassmaUnknownArgumentError);
    expect(typed.count({})).toBe(3);
  });
});

describe("スカラー列の set はエラー", () => {
  test("update: age に set はエラーになりセルが壊れない", () => {
    const { loose, typed } = looseUsers();
    const fn = () =>
      loose.update({ where: { id: 1 }, data: { age: { set: 5 } } });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow(
      "Unknown argument `set`.\n\nAvailable: increment, decrement, multiply, divide",
    );
    aliceUnchanged(typed);
  });

  test("update: relations ありでもスカラー列の set はエラー", () => {
    const { loose, typed } = loosePosts();
    expect(() =>
      loose.update({ where: { id: 101 }, data: { title: { set: "X" } } }),
    ).toThrow(GassmaUnknownArgumentError);
    expect(typed.findFirst({ where: { id: 101 } })).toEqual({
      id: 101,
      authorId: 1,
      title: "Post A",
    });
  });

  test("updateMany: スカラー列の set はエラーになり全行無変化", () => {
    const { loose, typed } = looseUsers();
    expect(() =>
      loose.updateMany({
        where: { age: { gte: 0 } },
        data: { age: { set: 5 } },
      }),
    ).toThrow(GassmaUnknownArgumentError);
    aliceUnchanged(typed);
  });
});

describe("リレーション名に不正な値", () => {
  test("update: リレーション名にスカラー値は専用メッセージでエラー", () => {
    const { loose, typed } = looseUsers({ relations: true });
    const fn = () => loose.update({ where: { id: 1 }, data: { posts: "abc" } });
    expect(fn).toThrow(GassmaInvalidValueError);
    expect(fn).toThrow("Invalid value for argument `posts`.");
    aliceUnchanged(typed);
  });

  test("create: リレーション名にスカラー値は専用メッセージでエラー", () => {
    const { loose, typed } = looseUsers({ relations: true });
    expect(() =>
      loose.create({ data: { id: 9, name: "Zed", age: 1, posts: "abc" } }),
    ).toThrow(GassmaInvalidValueError);
    expect(typed.count({})).toBe(3);
  });

  test("createMany: nested write 非対応なのでリレーション名はエラー", () => {
    const { loose, typed } = looseUsers({ relations: true });
    const fn = () =>
      loose.createMany({
        data: [
          {
            id: 9,
            name: "Zed",
            age: 1,
            posts: { create: { id: 200, authorId: 9, title: "New" } },
          },
        ],
      });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow("Available: id, name, age");
    expect(typed.count({})).toBe(3);
  });

  test("updateMany: nested write 非対応なのでリレーション名はエラー", () => {
    const { loose, typed } = looseUsers({ relations: true });
    expect(() =>
      loose.updateMany({
        where: { id: 1 },
        data: { posts: { connect: { id: 102 } } },
      }),
    ).toThrow(GassmaUnknownArgumentError);
    aliceUnchanged(typed);
  });
});

describe("対象行が無くても入力は検証される", () => {
  test("update: where 不一致でも typo はエラー", () => {
    const { loose, typed } = looseUsers();
    const fn = () => loose.update({ where: { id: 999 }, data: { nmae: "X" } });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow("Unknown argument `nmae`. Did you mean `name`?");
    expect(typed.count({})).toBe(3);
  });

  test("update: relations ありでも where 不一致の typo はエラー", () => {
    const { loose, typed } = looseUsers({ relations: true });
    expect(() =>
      loose.update({ where: { id: 999 }, data: { nmae: "X" } }),
    ).toThrow(GassmaUnknownArgumentError);
    expect(typed.count({})).toBe(3);
  });

  test("update: where 不一致で typo 無しは従来どおり null", () => {
    const { loose, typed } = looseUsers();
    expect(
      loose.update({ where: { id: 999 }, data: { name: "X" } }),
    ).toBeNull();
    expect(typed.count({})).toBe(3);
  });

  test("updateMany: where 不一致でも typo はエラー", () => {
    const { loose, typed } = looseUsers();
    expect(() =>
      loose.updateMany({ where: { id: 999 }, data: { nmae: "X" } }),
    ).toThrow(GassmaUnknownArgumentError);
    aliceUnchanged(typed);
  });

  test("upsert(作成分岐): 未実行の update 側の typo もエラーになり追加されない", () => {
    const { loose, typed } = looseUsers();
    expect(() =>
      loose.upsert({
        where: { id: 999 },
        create: { id: 999, name: "A", age: 1 },
        update: { nmae: "X" },
      }),
    ).toThrow(GassmaUnknownArgumentError);
    expect(typed.count({})).toBe(3);
  });

  test("upsert(更新分岐): 未実行の create 側の typo もエラーになり更新されない", () => {
    const { loose, typed } = looseUsers();
    expect(() =>
      loose.upsert({
        where: { id: 1 },
        create: { id: 1, nmae: "Alice", age: 20 },
        update: { name: "X" },
      }),
    ).toThrow(GassmaUnknownArgumentError);
    aliceUnchanged(typed);
  });

  test("upsert: relations ありでも未実行の update 側の typo はエラー", () => {
    const { loose, typed } = looseUsers({ relations: true });
    expect(() =>
      loose.upsert({
        where: { id: 999 },
        create: { id: 999, name: "A", age: 1 },
        update: { nmae: "X" },
      }),
    ).toThrow(GassmaUnknownArgumentError);
    expect(typed.count({})).toBe(3);
  });
});

describe("従来どおり動くこと", () => {
  test("正しい列名の create は通る", () => {
    const { typed } = looseUsers();
    expect(typed.create({ data: { id: 9, name: "Zed", age: 1 } })).toEqual({
      id: 9,
      name: "Zed",
      age: 1,
    });
    expect(typed.count({})).toBe(4);
  });

  test("数値演算 increment は通る", () => {
    const { loose, typed } = looseUsers();
    loose.update({ where: { id: 1 }, data: { age: { increment: 5 } } });
    expect(typed.findFirst({ where: { id: 1 } })).toEqual({
      id: 1,
      name: "Alice",
      age: 25,
    });
  });

  test("undefined 値の未知キーは無視される", () => {
    const { loose, typed } = looseUsers();
    loose.create({ data: { id: 9, name: "Zed", age: 1, nmae: undefined } });
    expect(typed.count({})).toBe(4);
  });

  test("nested write の create は通る", () => {
    const client = buildTestClient({ relations: true });
    const users: any = sheetOf(client, "Users");
    const posts = sheetOf(client, "Posts");
    users.create({
      data: {
        id: 9,
        name: "Zed",
        age: 1,
        posts: { create: { id: 200, title: "New" } },
      },
    });
    expect(posts.findFirst({ where: { id: 200 } })).toEqual({
      id: 200,
      authorId: 9,
      title: "New",
    });
  });

  test("nested write の connect / set / disconnect は通る", () => {
    const { loose } = looseUsers({ relations: true });
    expect(() =>
      loose.update({
        where: { id: 1 },
        data: { posts: { connect: { id: 102 } } },
      }),
    ).not.toThrow();
    expect(() =>
      loose.update({
        where: { id: 1 },
        data: { posts: { set: [{ id: 101 }] } },
      }),
    ).not.toThrow();
    expect(() =>
      loose.update({
        where: { id: 1 },
        data: { posts: { disconnect: { id: 101 } } },
      }),
    ).not.toThrow();
  });
});

describe("$transaction 経由", () => {
  test("tx 内の create typo もエラーになりシートが変化しない", () => {
    const env = buildTxTestEnv();
    const tx = (env.client as any).$transaction.bind(env.client);
    expect(() =>
      tx((txClient: any) => {
        txClient.Users.create({ data: { id: 9, nmae: "Zed", age: 1 } });
      }),
    ).toThrow(GassmaUnknownArgumentError);
    expect(env.users.snapshot()).toEqual([
      ["id", "name", "age"],
      [1, "Alice", 20],
      [2, "Bob", 30],
    ]);
  });
});

describe("$extends 経由", () => {
  test("query フックを素通しした data の未知列もエラー", () => {
    const client = buildTestClient();
    const extended = client.$extends({
      query: {
        Users: {
          create({ args, query }) {
            return query(args);
          },
        },
      },
    });
    const loose: any = extended.Users;
    expect(() =>
      loose.create({ data: { id: 9, nmae: "Zed", age: 1 } }),
    ).toThrow(GassmaUnknownArgumentError);
    expect(extended.Users.count({})).toBe(3);
  });
});
