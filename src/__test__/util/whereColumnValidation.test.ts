import { GassmaUnknownArgumentError } from "../../errors/argument/argumentError";
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

describe("where の列名 typo で書き込みが誤爆しない", () => {
  test("deleteMany: nmae (name の typo) はエラーになり全件削除されない", () => {
    const { loose, typed } = looseUsers();
    const fn = () => loose.deleteMany({ where: { nmae: "Alice" } });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow(
      "Unknown argument `nmae`. Did you mean `name`?\n\nAvailable: id, name, age",
    );
    expect(typed.count({})).toBe(3);
  });

  test("delete: nmae はエラーになり先頭行が削除されない", () => {
    const { loose, typed } = looseUsers();
    expect(() => loose.delete({ where: { nmae: "Zed" } })).toThrow(
      GassmaUnknownArgumentError,
    );
    expect(typed.count({})).toBe(3);
    expect(typed.findFirst({ where: { name: "Alice" } })).toEqual({
      id: 1,
      name: "Alice",
      age: 20,
    });
  });

  test("upsert: nmae はエラーになり作成も更新もされない", () => {
    const { loose, typed } = looseUsers();
    expect(() =>
      loose.upsert({
        where: { nmae: "Zed" },
        create: { id: 9, name: "Zed", age: 1 },
        update: { name: "X" },
      }),
    ).toThrow(GassmaUnknownArgumentError);
    expect(typed.count({})).toBe(3);
    expect(typed.findFirst({ where: { id: 1 } })).toEqual({
      id: 1,
      name: "Alice",
      age: 20,
    });
  });

  test("update: 未知列はエラーになり行が更新されない", () => {
    const { loose, typed } = looseUsers();
    expect(() =>
      loose.update({ where: { nmae: "Alice" }, data: { age: 0 } }),
    ).toThrow(GassmaUnknownArgumentError);
    expect(typed.findFirst({ where: { id: 1 } })).toEqual({
      id: 1,
      name: "Alice",
      age: 20,
    });
  });

  test("updateMany: 未知列はエラーになり行が更新されない", () => {
    const { loose, typed } = looseUsers();
    expect(() =>
      loose.updateMany({ where: { nmae: "Alice" }, data: { age: 0 } }),
    ).toThrow(GassmaUnknownArgumentError);
    expect(typed.findMany({ where: { age: 0 } })).toEqual([]);
  });
});

describe("読み取り系でも where の未知列はエラー", () => {
  test("findMany", () => {
    const { loose } = looseUsers();
    expect(() => loose.findMany({ where: { nmae: "Alice" } })).toThrow(
      GassmaUnknownArgumentError,
    );
  });

  test("findFirst", () => {
    const { loose } = looseUsers();
    expect(() => loose.findFirst({ where: { nmae: "Alice" } })).toThrow(
      GassmaUnknownArgumentError,
    );
  });

  test("count", () => {
    const { loose } = looseUsers();
    expect(() => loose.count({ where: { nmae: "Alice" } })).toThrow(
      GassmaUnknownArgumentError,
    );
  });

  test("aggregate", () => {
    const { loose } = looseUsers();
    expect(() =>
      loose.aggregate({ _sum: { age: true }, where: { nmae: "Alice" } }),
    ).toThrow(GassmaUnknownArgumentError);
  });

  test("groupBy", () => {
    const { loose } = looseUsers();
    expect(() =>
      loose.groupBy({ by: ["name"], where: { nmae: "Alice" } }),
    ).toThrow(GassmaUnknownArgumentError);
  });
});

describe("AND/OR/NOT の内側でも未知列はエラー", () => {
  test("AND 配列の中", () => {
    const { loose } = looseUsers();
    expect(() =>
      loose.findMany({ where: { AND: [{ nmae: "Alice" }] } }),
    ).toThrow(GassmaUnknownArgumentError);
  });

  test("OR 配列の中", () => {
    const { loose } = looseUsers();
    expect(() =>
      loose.findMany({ where: { OR: [{ nmae: "Alice" }] } }),
    ).toThrow(GassmaUnknownArgumentError);
  });

  test("NOT (dict 形) の中", () => {
    const { loose } = looseUsers();
    expect(() => loose.findMany({ where: { NOT: { nmae: "Alice" } } })).toThrow(
      GassmaUnknownArgumentError,
    );
  });

  test("深いネストの中", () => {
    const { loose } = looseUsers();
    expect(() =>
      loose.deleteMany({
        where: { OR: [{ AND: [{ NOT: { nmae: "Alice" } }] }] },
      }),
    ).toThrow(GassmaUnknownArgumentError);
  });
});

describe("リレーション名の typo", () => {
  test("autor (author の typo) はサジェスト付きエラー", () => {
    const { loose } = loosePosts();
    const fn = () =>
      loose.findMany({ where: { autor: { is: { name: "A" } } } });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow("Unknown argument `autor`. Did you mean `author`?");
  });

  test("Available にはリレーション名も並ぶ", () => {
    const { loose } = loosePosts();
    expect(() => loose.findMany({ where: { autor: { is: {} } } })).toThrow(
      "Available: id, authorId, title, author, comments",
    );
  });

  test("is フィルタの内側の未知列は相手シート基準でエラー", () => {
    const { loose } = loosePosts();
    const fn = () =>
      loose.findMany({ where: { author: { is: { nmae: "Alice" } } } });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow("Unknown argument `nmae`. Did you mean `name`?");
  });
});

describe("従来どおり動くこと", () => {
  test("正しい列名の where は通る", () => {
    const { typed } = looseUsers();
    expect(typed.findMany({ where: { name: "Alice" } })).toEqual([
      { id: 1, name: "Alice", age: 20 },
    ]);
  });

  test("演算子付き条件も通る", () => {
    const { typed } = looseUsers();
    expect(typed.findMany({ where: { age: { gte: 30 } } })).toHaveLength(2);
  });

  test("リレーションフィルタ some も通る", () => {
    const { typed } = looseUsers({ relations: true });
    expect(
      typed.findMany({ where: { posts: { some: { title: "Post A" } } } }),
    ).toEqual([{ id: 1, name: "Alice", age: 20 }]);
  });

  test("リレーションフィルタ is も通る", () => {
    const { typed } = loosePosts();
    expect(
      typed.findMany({ where: { author: { is: { name: "Alice" } } } }),
    ).toEqual([{ id: 101, authorId: 1, title: "Post A" }]);
  });

  test("AND/OR/NOT の正しい条件も通る", () => {
    const { typed } = looseUsers();
    expect(
      typed.findMany({
        where: { AND: [{ age: { gte: 20 } }], NOT: { name: "Bob" } },
      }),
    ).toHaveLength(2);
  });

  test("where: {} は全件マッチのまま", () => {
    const { typed } = looseUsers();
    expect(typed.findMany({ where: {} })).toHaveLength(3);
  });
});

describe("$transaction 経由", () => {
  test("tx 内の deleteMany({where:{nmae}}) もエラーになりシートが変化しない", () => {
    const env = buildTxTestEnv();
    const tx = (env.client as any).$transaction.bind(env.client);
    expect(() =>
      tx((txClient: any) => {
        txClient.Users.deleteMany({ where: { nmae: "Alice" } });
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
  test("query フックを素通しした未知列もエラー", () => {
    const client = buildTestClient();
    const extended = client.$extends({
      query: {
        Users: {
          deleteMany({ args, query }) {
            return query(args);
          },
        },
      },
    });
    const loose: any = extended.Users;
    expect(() => loose.deleteMany({ where: { nmae: "Alice" } })).toThrow(
      GassmaUnknownArgumentError,
    );
    expect(extended.Users.count({})).toBe(3);
  });
});
