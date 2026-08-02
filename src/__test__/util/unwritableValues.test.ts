import { GassmaInvalidValueError } from "../../errors/argument/argumentError";
import { raw } from "../../util/raw/raw";
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

const aliceUnchanged = (typed: ReturnType<typeof sheetOf>) => {
  expect(typed.findFirst({ where: { id: 1 } })).toEqual({
    id: 1,
    name: "Alice",
    age: 20,
  });
};

describe("セルに書けない数値はエラー", () => {
  test("create: NaN はエラーになり行が追加されない", () => {
    const { loose, typed } = looseUsers();
    const fn = () =>
      loose.create({ data: { id: 9, name: "Zed", age: Number("abc") } });
    expect(fn).toThrow(GassmaInvalidValueError);
    expect(fn).toThrow(
      "Invalid value for argument `age`. Expected a finite number, but received NaN.",
    );
    expect(typed.count({})).toBe(3);
  });

  test("create: Infinity はエラーになり行が追加されない", () => {
    const { loose, typed } = looseUsers();
    const fn = () => loose.create({ data: { id: 9, name: "Z", age: 1 / 0 } });
    expect(fn).toThrow(
      "Invalid value for argument `age`. Expected a finite number, but received Infinity.",
    );
    expect(typed.count({})).toBe(3);
  });

  test("create: -Infinity はエラーになり行が追加されない", () => {
    const { loose, typed } = looseUsers();
    expect(() =>
      loose.create({ data: { id: 9, name: "Z", age: -1 / 0 } }),
    ).toThrow(
      "Invalid value for argument `age`. Expected a finite number, but received -Infinity.",
    );
    expect(typed.count({})).toBe(3);
  });

  test("createMany: 2行目の NaN もエラーになり1行も追加されない", () => {
    const { loose, typed } = looseUsers();
    expect(() =>
      loose.createMany({
        data: [
          { id: 8, name: "Yui", age: 2 },
          { id: 9, name: "Zed", age: NaN },
        ],
      }),
    ).toThrow(GassmaInvalidValueError);
    expect(typed.count({})).toBe(3);
  });

  test("update: NaN はエラーになり行が更新されない", () => {
    const { loose, typed } = looseUsers();
    expect(() =>
      loose.update({ where: { id: 1 }, data: { age: NaN } }),
    ).toThrow(GassmaInvalidValueError);
    aliceUnchanged(typed);
  });

  test("updateMany: Infinity はエラーになり全行無変化", () => {
    const { loose, typed } = looseUsers();
    expect(() =>
      loose.updateMany({ where: { age: { gte: 0 } }, data: { age: Infinity } }),
    ).toThrow(GassmaInvalidValueError);
    aliceUnchanged(typed);
  });

  test("update: increment に NaN はエラーになりセルが壊れない", () => {
    const { loose, typed } = looseUsers();
    const fn = () =>
      loose.update({ where: { id: 1 }, data: { age: { increment: NaN } } });
    expect(fn).toThrow(
      "Invalid value for argument `increment`. Expected a finite number, but received NaN.",
    );
    aliceUnchanged(typed);
  });

  test("updateMany: divide に Infinity はエラー", () => {
    const { loose, typed } = looseUsers();
    expect(() =>
      loose.updateMany({
        where: { id: 1 },
        data: { age: { divide: Infinity } },
      }),
    ).toThrow(GassmaInvalidValueError);
    aliceUnchanged(typed);
  });
});

describe("Invalid Date はエラー", () => {
  test("create: Invalid Date はエラーになり行が追加されない", () => {
    const { loose, typed } = looseUsers();
    const fn = () =>
      loose.create({ data: { id: 9, name: "Z", age: new Date("nope") } });
    expect(fn).toThrow(GassmaInvalidValueError);
    expect(fn).toThrow(
      "Invalid value for argument `age`. Expected a valid Date, but the provided Date object is invalid.",
    );
    expect(typed.count({})).toBe(3);
  });

  test("update: Invalid Date はエラーになり行が更新されない", () => {
    const { loose, typed } = looseUsers();
    expect(() =>
      loose.update({ where: { id: 1 }, data: { age: new Date("nope") } }),
    ).toThrow(GassmaInvalidValueError);
    aliceUnchanged(typed);
  });
});

describe("セルに書けない型はエラー", () => {
  test("create: 配列はエラーになり行が追加されない", () => {
    const { loose, typed } = looseUsers();
    const fn = () => loose.create({ data: { id: 9, name: [1, 2], age: 1 } });
    expect(fn).toThrow(
      "Invalid value for argument `name`. Expected a scalar value, but received an array.",
    );
    expect(typed.count({})).toBe(3);
  });

  test("create: 関数はエラーになり行が追加されない", () => {
    const { loose, typed } = looseUsers();
    expect(() =>
      loose.create({ data: { id: 9, name: () => "Z", age: 1 } }),
    ).toThrow(
      "Invalid value for argument `name`. Expected a scalar value, but received a function.",
    );
    expect(typed.count({})).toBe(3);
  });

  test("create: Symbol はエラーになり行が追加されない", () => {
    const { loose, typed } = looseUsers();
    expect(() =>
      loose.create({ data: { id: 9, name: Symbol("Z"), age: 1 } }),
    ).toThrow(
      "Invalid value for argument `name`. Expected a scalar value, but received a symbol.",
    );
    expect(typed.count({})).toBe(3);
  });

  test("create: BigInt はエラーになり行が追加されない", () => {
    const { loose, typed } = looseUsers();
    expect(() =>
      loose.create({ data: { id: 9, name: "Z", age: BigInt(5) } }),
    ).toThrow(
      "Invalid value for argument `age`. Expected a scalar value, but received a bigint.",
    );
    expect(typed.count({})).toBe(3);
  });
});

describe("upsert は未実行の分岐も検証される", () => {
  test("upsert(作成分岐): update 側の NaN もエラーになり追加されない", () => {
    const { loose, typed } = looseUsers();
    expect(() =>
      loose.upsert({
        where: { id: 999 },
        create: { id: 999, name: "A", age: 1 },
        update: { age: NaN },
      }),
    ).toThrow(GassmaInvalidValueError);
    expect(typed.count({})).toBe(3);
  });

  test("upsert(更新分岐): create 側の NaN もエラーになり更新されない", () => {
    const { loose, typed } = looseUsers();
    expect(() =>
      loose.upsert({
        where: { id: 1 },
        create: { id: 1, name: "Alice", age: NaN },
        update: { name: "X" },
      }),
    ).toThrow(GassmaInvalidValueError);
    aliceUnchanged(typed);
  });
});

describe("nested write でもエラー", () => {
  test("nested create の子データの NaN はエラーになり子が追加されない", () => {
    const client = buildTestClient({ relations: true });
    const users: any = sheetOf(client, "Users");
    const posts = sheetOf(client, "Posts");
    expect(() =>
      users.create({
        data: {
          id: 9,
          name: "Zed",
          age: 1,
          posts: { create: { id: 200, title: NaN } },
        },
      }),
    ).toThrow(GassmaInvalidValueError);
    expect(posts.count({})).toBe(2);
  });

  test("nested update の子データの NaN はエラーになり子が更新されない", () => {
    const client = buildTestClient({ relations: true });
    const users: any = sheetOf(client, "Users");
    const posts = sheetOf(client, "Posts");
    expect(() =>
      users.update({
        where: { id: 1 },
        data: {
          posts: { update: { where: { id: 101 }, data: { title: NaN } } },
        },
      }),
    ).toThrow(GassmaInvalidValueError);
    expect(posts.findFirst({ where: { id: 101 } })).toEqual({
      id: 101,
      authorId: 1,
      title: "Post A",
    });
  });
});

describe("$transaction 経由", () => {
  test("tx 内の NaN もエラーになりシートが変化しない", () => {
    const env = buildTxTestEnv();
    const tx = (env.client as any).$transaction.bind(env.client);
    expect(() =>
      tx((txClient: any) => {
        txClient.Users.create({ data: { id: 9, name: "Zed", age: NaN } });
      }),
    ).toThrow(GassmaInvalidValueError);
    expect(env.users.snapshot()).toEqual([
      ["id", "name", "age"],
      [1, "Alice", 20],
      [2, "Bob", 30],
    ]);
  });
});

describe("$extends 経由", () => {
  test("query フックを素通しした data の NaN もエラー", () => {
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
      loose.create({ data: { id: 9, name: "Zed", age: NaN } }),
    ).toThrow(GassmaInvalidValueError);
    expect(extended.Users.count({})).toBe(3);
  });
});

describe("書ける値は従来どおり通る", () => {
  test("数値・文字列・真偽値・null は通る", () => {
    const { loose, typed } = looseUsers();
    loose.create({ data: { id: 9, name: "Zed", age: 0 } });
    loose.create({ data: { id: 10, name: "", age: null } });
    loose.update({ where: { id: 9 }, data: { name: "Zed2" } });
    expect(typed.count({})).toBe(5);
  });

  test("正常な Date は通る", () => {
    const { loose, typed } = looseUsers();
    loose.create({
      data: { id: 9, name: "Z", age: new Date("2026-01-01T00:00:00Z") },
    });
    expect(typed.count({})).toBe(4);
  });

  test("Gassma.raw は素通し", () => {
    const { loose, typed } = looseUsers();
    loose.create({ data: { id: 9, name: raw("=SUM(A1:A2)"), age: 1 } });
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
});
