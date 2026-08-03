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

describe("where の直値の不正値はエラー", () => {
  test("NaN はエラー", () => {
    const { loose } = looseUsers();
    const fn = () => loose.findMany({ where: { age: NaN } });
    expect(fn).toThrow(GassmaInvalidValueError);
    expect(fn).toThrow(
      "Invalid value for argument `age`. Expected a finite number, but received NaN.",
    );
  });

  test("Infinity はエラー", () => {
    const { loose } = looseUsers();
    expect(() => loose.findMany({ where: { age: Infinity } })).toThrow(
      "Invalid value for argument `age`. Expected a finite number, but received Infinity.",
    );
  });

  test("-Infinity はエラー", () => {
    const { loose } = looseUsers();
    expect(() => loose.findFirst({ where: { age: -Infinity } })).toThrow(
      "Invalid value for argument `age`. Expected a finite number, but received -Infinity.",
    );
  });

  test("Invalid Date はエラー", () => {
    const { loose } = looseUsers();
    expect(() => loose.findMany({ where: { age: new Date("nope") } })).toThrow(
      "Invalid value for argument `age`. Expected a valid Date, but the provided Date object is invalid.",
    );
  });

  test("配列を直値に渡すとエラー", () => {
    const { loose } = looseUsers();
    expect(() => loose.findMany({ where: { age: [1, 2] } })).toThrow(
      "Invalid value for argument `age`. Expected a scalar value, but received an array.",
    );
  });

  test("関数はエラー", () => {
    const { loose } = looseUsers();
    expect(() => loose.findMany({ where: { name: () => "A" } })).toThrow(
      "Invalid value for argument `name`. Expected a scalar value, but received a function.",
    );
  });

  test("Symbol はエラー", () => {
    const { loose } = looseUsers();
    expect(() => loose.findMany({ where: { name: Symbol("A") } })).toThrow(
      "Invalid value for argument `name`. Expected a scalar value, but received a symbol.",
    );
  });

  test("BigInt はエラー", () => {
    const { loose } = looseUsers();
    expect(() => loose.findMany({ where: { age: BigInt(5) } })).toThrow(
      "Invalid value for argument `age`. Expected a scalar value, but received a bigint.",
    );
  });

  test("Gassma.raw はエラー", () => {
    const { loose } = looseUsers();
    expect(() =>
      loose.findMany({ where: { name: raw("=SUM(A1:A2)") } }),
    ).toThrow(
      "Invalid value for argument `name`. Expected a scalar value, but received a Gassma.raw value.",
    );
  });
});

describe("フィルタ演算子の不正値はエラー", () => {
  test("gte の NaN はエラー", () => {
    const { loose } = looseUsers();
    expect(() => loose.findMany({ where: { age: { gte: NaN } } })).toThrow(
      "Invalid value for argument `gte`. Expected a finite number, but received NaN.",
    );
  });

  test("lt の Infinity はエラー", () => {
    const { loose } = looseUsers();
    expect(() => loose.findMany({ where: { age: { lt: Infinity } } })).toThrow(
      GassmaInvalidValueError,
    );
  });

  test("in の配列の中の NaN はエラー", () => {
    const { loose } = looseUsers();
    expect(() => loose.findMany({ where: { age: { in: [1, NaN] } } })).toThrow(
      "Invalid value for argument `in`. Expected a finite number, but received NaN.",
    );
  });

  test("notIn の配列の中の Invalid Date はエラー", () => {
    const { loose } = looseUsers();
    expect(() =>
      loose.findMany({ where: { age: { notIn: [new Date("nope")] } } }),
    ).toThrow(
      "Invalid value for argument `notIn`. Expected a valid Date, but the provided Date object is invalid.",
    );
  });

  test("in の配列の中の配列はエラー", () => {
    const { loose } = looseUsers();
    expect(() => loose.findMany({ where: { age: { in: [[1]] } } })).toThrow(
      "Invalid value for argument `in`. Expected a scalar value, but received an array.",
    );
  });

  test("gte の配列はエラー", () => {
    const { loose } = looseUsers();
    expect(() => loose.findMany({ where: { age: { gte: [1] } } })).toThrow(
      "Invalid value for argument `gte`. Expected a scalar value, but received an array.",
    );
  });

  test("not の入れ子の NaN はエラー", () => {
    const { loose } = looseUsers();
    expect(() =>
      loose.findMany({ where: { age: { not: { equals: NaN } } } }),
    ).toThrow(GassmaInvalidValueError);
  });
});

describe("AND / OR / NOT の中もエラー", () => {
  test("OR の中の NaN はエラー", () => {
    const { loose } = looseUsers();
    expect(() =>
      loose.findMany({ where: { OR: [{ age: NaN }, { name: "Alice" }] } }),
    ).toThrow(GassmaInvalidValueError);
  });

  test("AND の入れ子の in の Invalid Date はエラー", () => {
    const { loose } = looseUsers();
    expect(() =>
      loose.findMany({
        where: { AND: [{ NOT: { age: { in: [new Date("nope")] } } }] },
      }),
    ).toThrow(GassmaInvalidValueError);
  });
});

describe("where を持つ他の操作もエラー", () => {
  test("count の where の NaN はエラー", () => {
    const { loose } = looseUsers();
    expect(() => loose.count({ where: { age: NaN } })).toThrow(
      GassmaInvalidValueError,
    );
  });

  test("updateMany の where の NaN はエラーで全行無変化", () => {
    const { loose, typed } = looseUsers();
    expect(() =>
      loose.updateMany({ where: { age: NaN }, data: { name: "X" } }),
    ).toThrow(GassmaInvalidValueError);
    expect(typed.findFirst({ where: { id: 1 } })).toEqual({
      id: 1,
      name: "Alice",
      age: 20,
    });
  });

  test("deleteMany の where の Invalid Date はエラーで全行残る", () => {
    const { loose, typed } = looseUsers();
    expect(() =>
      loose.deleteMany({ where: { age: new Date("nope") } }),
    ).toThrow(GassmaInvalidValueError);
    expect(typed.count({})).toBe(3);
  });

  test("aggregate の where の NaN はエラー", () => {
    const { loose } = looseUsers();
    expect(() =>
      loose.aggregate({ _max: { age: true }, where: { age: NaN } }),
    ).toThrow(GassmaInvalidValueError);
  });
});

describe("cursor の不正値はエラー", () => {
  test("findMany の cursor の NaN はエラー", () => {
    const { loose } = looseUsers();
    expect(() =>
      loose.findMany({ cursor: { id: NaN }, orderBy: { id: "asc" } }),
    ).toThrow(
      "Invalid value for argument `id`. Expected a finite number, but received NaN.",
    );
  });

  test("findFirst の cursor の Invalid Date はエラー", () => {
    const { loose } = looseUsers();
    expect(() => loose.findFirst({ cursor: { id: new Date("nope") } })).toThrow(
      GassmaInvalidValueError,
    );
  });

  test("cursor の配列はエラー", () => {
    const { loose } = looseUsers();
    expect(() => loose.findMany({ cursor: { id: [1] } })).toThrow(
      GassmaInvalidValueError,
    );
  });
});

describe("having の不正値はエラー", () => {
  test("集計条件の NaN はエラー", () => {
    const { loose } = looseUsers();
    expect(() =>
      loose.groupBy({
        by: ["age"],
        _min: { age: true },
        having: { age: { _min: { gte: NaN } } },
      }),
    ).toThrow(
      "Invalid value for argument `gte`. Expected a finite number, but received NaN.",
    );
  });

  test("having の OR の中の Infinity はエラー", () => {
    const { loose } = looseUsers();
    expect(() =>
      loose.groupBy({
        by: ["age"],
        _min: { age: true },
        having: { OR: [{ age: { _min: { lt: Infinity } } }] },
      }),
    ).toThrow(GassmaInvalidValueError);
  });
});

describe("リレーションフィルタの内側もエラー", () => {
  test("some の中の NaN はエラー", () => {
    const { loose } = looseUsers({ relations: true });
    expect(() =>
      loose.findMany({ where: { posts: { some: { title: NaN } } } }),
    ).toThrow(GassmaInvalidValueError);
  });

  test("every の中の Invalid Date はエラー", () => {
    const { loose } = looseUsers({ relations: true });
    expect(() =>
      loose.findMany({
        where: { posts: { every: { title: new Date("nope") } } },
      }),
    ).toThrow(GassmaInvalidValueError);
  });

  test("is の中の NaN はエラー", () => {
    const client = buildTestClient({ relations: true });
    const posts: any = sheetOf(client, "Posts");
    expect(() =>
      posts.findMany({ where: { author: { is: { age: NaN } } } }),
    ).toThrow(GassmaInvalidValueError);
  });

  test("include の where の NaN はエラー", () => {
    const { loose } = looseUsers({ relations: true });
    expect(() =>
      loose.findMany({ include: { posts: { where: { title: NaN } } } }),
    ).toThrow(GassmaInvalidValueError);
  });
});

describe("nested write の where もエラー", () => {
  test("connect の NaN はエラーで FK が変化しない", () => {
    const client = buildTestClient({ relations: true });
    const users: any = sheetOf(client, "Users");
    const posts = sheetOf(client, "Posts");
    expect(() =>
      users.update({
        where: { id: 1 },
        data: { posts: { connect: { id: NaN } } },
      }),
    ).toThrow(GassmaInvalidValueError);
    expect(posts.findMany({})).toEqual([
      { id: 101, authorId: 1, title: "Post A" },
      { id: 102, authorId: 2, title: "Post B" },
    ]);
  });

  test("nested update の where の NaN はエラー", () => {
    const client = buildTestClient({ relations: true });
    const users: any = sheetOf(client, "Users");
    expect(() =>
      users.update({
        where: { id: 1 },
        data: {
          posts: { update: { where: { id: NaN }, data: { title: "X" } } },
        },
      }),
    ).toThrow(GassmaInvalidValueError);
  });
});

describe("$transaction / $extends 経由もエラー", () => {
  test("tx 内の where の NaN もエラーでシートが変化しない", () => {
    const env = buildTxTestEnv();
    const tx = (env.client as any).$transaction.bind(env.client);
    expect(() =>
      tx((txClient: any) => {
        txClient.Users.updateMany({
          where: { age: NaN },
          data: { name: "X" },
        });
      }),
    ).toThrow(GassmaInvalidValueError);
    expect(env.users.snapshot()).toEqual([
      ["id", "name", "age"],
      [1, "Alice", 20],
      [2, "Bob", 30],
    ]);
  });

  test("query フックを素通しした where の NaN もエラー", () => {
    const client = buildTestClient();
    const extended = client.$extends({
      query: {
        Users: {
          findMany({ args, query }) {
            return query(args);
          },
        },
      },
    });
    const loose: any = extended.Users;
    expect(() => loose.findMany({ where: { age: NaN } })).toThrow(
      GassmaInvalidValueError,
    );
  });
});

describe("正常な値は従来どおり通る", () => {
  test("数値・文字列・真偽値・null の where は通る", () => {
    const { typed } = looseUsers();
    expect(typed.findMany({ where: { age: 20 } })).toEqual([
      { id: 1, name: "Alice", age: 20 },
    ]);
    expect(typed.findMany({ where: { name: "Bob" } })).toHaveLength(1);
    expect(typed.findMany({ where: { age: null } })).toEqual([]);
  });

  test("in / notIn / 比較演算子の正常値は通る", () => {
    const { typed } = looseUsers();
    expect(typed.findMany({ where: { age: { in: [20, 30] } } })).toHaveLength(
      2,
    );
    expect(typed.findMany({ where: { age: { notIn: [20] } } })).toHaveLength(2);
    expect(
      typed.findMany({ where: { age: { gte: 21, lt: 40 } } }),
    ).toHaveLength(1);
    expect(typed.findMany({ where: { in: undefined, age: 20 } })).toHaveLength(
      1,
    );
  });

  test("正常な Date の where は通る", () => {
    const { typed } = looseUsers();
    expect(
      typed.findMany({
        where: { age: { lt: new Date("2026-01-01T00:00:00Z") } },
      }),
    ).toHaveLength(3);
    expect(
      typed.findMany({ where: { age: new Date("2026-01-01T00:00:00Z") } }),
    ).toEqual([]);
  });

  test("undefined はエラーにならず条件未指定と同じ（Prisma 実測準拠）", () => {
    const { typed } = looseUsers();
    expect(typed.findMany({ where: { age: undefined } })).toHaveLength(3);
    expect(typed.findMany({ where: { age: { gte: undefined } } })).toHaveLength(
      3,
    );
  });

  test("正常な cursor / having / リレーションフィルタは通る", () => {
    const { typed } = looseUsers();
    expect(
      typed.findMany({ cursor: { id: 2 }, orderBy: { id: "asc" } }),
    ).toHaveLength(2);
    expect(
      typed.groupBy({
        by: ["age"],
        _min: { age: true },
        having: { age: { _min: { gte: 25 } } },
      }),
    ).toHaveLength(2);
    const { typed: withRel } = looseUsers({ relations: true });
    expect(
      withRel.findMany({ where: { posts: { some: { title: "Post A" } } } }),
    ).toHaveLength(1);
  });
});
