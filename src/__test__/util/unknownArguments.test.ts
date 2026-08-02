import { GassmaUnknownArgumentError } from "../../errors/argument/argumentError";
import { skip } from "../../util/skip/skip";
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

const expectUnknown = (fn: () => unknown, argumentName: string) => {
  expect(fn).toThrow(GassmaUnknownArgumentError);
  expect(fn).toThrow(`Unknown argument \`${argumentName}\`.`);
};

describe("deleteMany: 未知のトップレベルキー", () => {
  test("whre (where の typo) はエラーになり行を削除しない", () => {
    const { loose, typed } = looseUsers();
    const fn = () => loose.deleteMany({ whre: { name: "Alice" } });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow(
      "Unknown argument `whre`. Did you mean `where`?\n\nAvailable: where, limit",
    );
    expect(typed.count({})).toBe(3);
  });

  test("正しい where と未知キーが同居してもエラー", () => {
    const { loose, typed } = looseUsers();
    expectUnknown(
      () => loose.deleteMany({ where: { name: "Alice" }, limt: 1 }),
      "limt",
    );
    expect(typed.count({})).toBe(3);
  });
});

describe("deleteMany: 未知のフィルタ演算子でシートが変化しない", () => {
  test("gth (gt の typo) はエラーになり行を削除しない", () => {
    const { loose, typed } = looseUsers();
    const fn = () => loose.deleteMany({ where: { age: { gth: 30 } } });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow("Unknown argument `gth`. Did you mean `gt`?");
    expect(typed.count({})).toBe(3);
  });
});

describe("各操作の未知のトップレベルキー", () => {
  test("findMany: oderBy", () => {
    const { loose } = looseUsers();
    const fn = () => loose.findMany({ oderBy: { id: "asc" } });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow("Unknown argument `oderBy`. Did you mean `orderBy`?");
  });

  test("findFirst: whre", () => {
    const { loose } = looseUsers();
    expectUnknown(() => loose.findFirst({ whre: { id: 1 } }), "whre");
  });

  test("findFirstOrThrow: incldue", () => {
    const { loose } = looseUsers();
    expectUnknown(() => loose.findFirstOrThrow({ incldue: {} }), "incldue");
  });

  test("count: wheer", () => {
    const { loose } = looseUsers();
    expectUnknown(() => loose.count({ wheer: { id: 1 } }), "wheer");
  });

  test("count: omit は許可されない", () => {
    const { loose } = looseUsers();
    expectUnknown(() => loose.count({ omit: { name: true } }), "omit");
  });

  test("count: distinct は許可されない", () => {
    const { loose } = looseUsers();
    expectUnknown(() => loose.count({ distinct: ["name"] }), "distinct");
  });

  test("count: where は従来どおり効く", () => {
    const { typed } = looseUsers();
    expect(typed.count({ where: { name: "Alice" } })).toBe(1);
  });

  test("aggregate: whre (正しい _sum と同居)", () => {
    const { loose } = looseUsers();
    expectUnknown(
      () => loose.aggregate({ _sum: { age: true }, whre: {} }),
      "whre",
    );
  });

  test("groupBy: havng (正しい by と同居)", () => {
    const { loose } = looseUsers();
    expectUnknown(
      () => loose.groupBy({ by: ["name"], havng: { age: { gt: 1 } } }),
      "havng",
    );
  });

  test("create: dta はエラーになり行を作らない", () => {
    const { loose, typed } = looseUsers();
    expectUnknown(
      () => loose.create({ dta: { id: 4, name: "Dave", age: 50 } }),
      "dta",
    );
    expect(typed.count({})).toBe(3);
  });

  test("createMany: skipDuplicates は近い候補が無いので Available のみ", () => {
    const { loose, typed } = looseUsers();
    const fn = () => loose.createMany({ data: [], skipDuplicates: true });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow("Unknown argument `skipDuplicates`.\n\nAvailable: data");
    expect(typed.count({})).toBe(3);
  });

  test("createManyAndReturn: slect", () => {
    const { loose } = looseUsers();
    expectUnknown(
      () => loose.createManyAndReturn({ data: [], slect: {} }),
      "slect",
    );
  });

  test("update: wher はエラーになり行を更新しない", () => {
    const { loose, typed } = looseUsers();
    expectUnknown(
      () => loose.update({ wher: { id: 1 }, data: { name: "X" } }),
      "wher",
    );
    expect(typed.findFirst({ where: { id: 1 } })).toEqual({
      id: 1,
      name: "Alice",
      age: 20,
    });
  });

  test("updateMany: limt はエラーになり行を更新しない", () => {
    const { loose, typed } = looseUsers();
    expectUnknown(
      () => loose.updateMany({ where: {}, data: { age: 0 }, limt: 1 }),
      "limt",
    );
    expect(typed.findFirst({ where: { id: 1 } })).toEqual({
      id: 1,
      name: "Alice",
      age: 20,
    });
  });

  test("updateManyAndReturn: datta", () => {
    const { loose } = looseUsers();
    expectUnknown(
      () => loose.updateManyAndReturn({ where: {}, datta: { age: 0 } }),
      "datta",
    );
  });

  test("upsert: craete", () => {
    const { loose } = looseUsers();
    expectUnknown(
      () =>
        loose.upsert({
          where: { id: 1 },
          craete: { id: 1 },
          update: { name: "X" },
        }),
      "craete",
    );
  });

  test("delete: includ はエラーになり行を削除しない", () => {
    const { loose, typed } = looseUsers();
    expectUnknown(
      () => loose.delete({ where: { id: 1 }, includ: {} }),
      "includ",
    );
    expect(typed.count({})).toBe(3);
  });
});

describe("where 内の未知演算子(経路別)", () => {
  test("AND の中でもエラー", () => {
    const { loose } = looseUsers();
    expectUnknown(
      () => loose.findMany({ where: { AND: [{ age: { gth: 10 } }] } }),
      "gth",
    );
  });

  test("OR の中でもエラー", () => {
    const { loose } = looseUsers();
    expectUnknown(
      () => loose.findMany({ where: { OR: [{ age: { lts: 10 } }] } }),
      "lts",
    );
  });

  test("NOT の中でもエラー", () => {
    const { loose } = looseUsers();
    expectUnknown(
      () => loose.findMany({ where: { NOT: [{ age: { eqauls: 10 } }] } }),
      "eqauls",
    );
  });

  test("リレーションフィルタの内側でもエラー", () => {
    const { loose } = looseUsers({ relations: true });
    const fn = () =>
      loose.findMany({
        where: { posts: { some: { title: { containz: "Post" } } } },
      });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow("Unknown argument `containz`. Did you mean `contains`?");
  });

  test("where: { 列: {} } は従来どおり全件マッチ(挙動維持)", () => {
    const { typed } = looseUsers();
    expect(typed.findMany({ where: { age: {} } })).toHaveLength(3);
  });
});

describe("skip センチネル", () => {
  test("値が skip のキーは省略扱いになり未知キー検証にかからない", () => {
    const { loose } = looseUsers();
    expect(loose.findMany({ where: { id: 1 }, foo: skip })).toEqual([
      { id: 1, name: "Alice", age: 20 },
    ]);
  });
});

describe("$transaction 経由", () => {
  test("tx 内の deleteMany({whre}) もエラーになりシートが変化しない", () => {
    const env = buildTxTestEnv();
    const tx = (env.client as any).$transaction.bind(env.client);
    expect(() =>
      tx((txClient: any) => {
        txClient.Users.deleteMany({ whre: { name: "Alice" } });
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
  test("query フックを素通しした未知キーもエラー", () => {
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
    expectUnknown(() => loose.deleteMany({ whre: { name: "Alice" } }), "whre");
    expect(extended.Users.count({})).toBe(3);
  });

  test("result 拡張と select の組み合わせは従来どおり動く", () => {
    const client = buildTestClient();
    const extended = client.$extends({
      result: {
        Users: {
          upperName: {
            needs: { name: true },
            compute: (user: { name: string }) => user.name.toUpperCase(),
          },
        },
      },
    });
    expect(
      extended.Users.findFirst({
        where: { id: 1 },
        select: { upperName: true },
      }),
    ).toEqual({ upperName: "ALICE" });
  });
});
