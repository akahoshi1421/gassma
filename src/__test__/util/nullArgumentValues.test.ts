import { GassmaInvalidValueError } from "../../errors/argument/argumentError";
import { WhereRelationInvalidFilterError } from "../../errors/relation/whereRelationError";
import { buildTestClient, sheetOf } from "./extends/extendsTestClient";
import { clearGasGlobals } from "./transaction/transactionTestClient";

afterEach(() => {
  clearGasGlobals();
});

const users = (): any => sheetOf(buildTestClient({ relations: true }), "Users");
const posts = (): any => sheetOf(buildTestClient({ relations: true }), "Posts");

const expectNullError = (fn: () => unknown, argumentName: string): void => {
  expect(fn).toThrow(GassmaInvalidValueError);
  expect(fn).toThrow(
    new RegExp(
      `Invalid value for argument \`${argumentName}\`\\..*but received null\\.`,
    ),
  );
};

describe("トップレベル引数の null はエラー", () => {
  test("findMany の where: null", () => {
    expectNullError(() => users().findMany({ where: null }), "where");
  });

  test("findMany の orderBy: null", () => {
    expectNullError(() => users().findMany({ orderBy: null }), "orderBy");
  });

  test("findMany の distinct: null", () => {
    expectNullError(() => users().findMany({ distinct: null }), "distinct");
  });

  test("findMany の cursor: null", () => {
    expectNullError(() => users().findMany({ cursor: null }), "cursor");
  });

  test("findFirst の where: null", () => {
    expectNullError(() => users().findFirst({ where: null }), "where");
  });

  test("findFirstOrThrow の where: null", () => {
    expectNullError(() => users().findFirstOrThrow({ where: null }), "where");
  });

  test("count の where: null", () => {
    expectNullError(() => users().count({ where: null }), "where");
  });

  test("aggregate の where: null", () => {
    expectNullError(
      () => users().aggregate({ where: null, _count: { id: true } }),
      "where",
    );
  });

  test("deleteMany の where: null は全件削除せずエラー", () => {
    const loose = users();
    expectNullError(() => loose.deleteMany({ where: null }), "where");
    expect(loose.findMany()).toHaveLength(3);
  });

  test("delete の where: null", () => {
    expectNullError(() => users().delete({ where: null }), "where");
  });

  test("update の where: null", () => {
    expectNullError(
      () => users().update({ where: null, data: { name: "X" } }),
      "where",
    );
  });

  test("updateMany の where: null は全件更新せずエラー", () => {
    const loose = users();
    expectNullError(
      () => loose.updateMany({ where: null, data: { name: "X" } }),
      "where",
    );
    expect(loose.findMany({ where: { name: "Alice" } })).toHaveLength(1);
  });

  test("groupBy の by: null", () => {
    expectNullError(() => users().groupBy({ by: null }), "by");
  });

  test("groupBy の having: null", () => {
    expectNullError(
      () => users().groupBy({ by: ["name"], having: null }),
      "having",
    );
  });

  test("groupBy の where: null", () => {
    expectNullError(
      () => users().groupBy({ by: ["name"], where: null }),
      "where",
    );
  });

  test("create の data: null", () => {
    expectNullError(() => users().create({ data: null }), "data");
  });

  test("createMany の data: null", () => {
    expectNullError(() => users().createMany({ data: null }), "data");
  });

  test("createManyAndReturn の data: null", () => {
    expectNullError(() => users().createManyAndReturn({ data: null }), "data");
  });

  test("update の data: null", () => {
    expectNullError(
      () => users().update({ where: { id: 1 }, data: null }),
      "data",
    );
  });

  test("updateMany の data: null", () => {
    expectNullError(
      () => users().updateMany({ where: { id: 1 }, data: null }),
      "data",
    );
  });

  test("updateManyAndReturn の data: null", () => {
    expectNullError(
      () => users().updateManyAndReturn({ where: { id: 1 }, data: null }),
      "data",
    );
  });

  test("upsert の create: null", () => {
    expectNullError(
      () => users().upsert({ where: { id: 9 }, create: null, update: {} }),
      "create",
    );
  });

  test("upsert の update: null", () => {
    expectNullError(
      () => users().upsert({ where: { id: 1 }, create: {}, update: null }),
      "update",
    );
  });
});

describe("配列要素の null はエラー", () => {
  test("distinct: [null]", () => {
    expectNullError(() => users().findMany({ distinct: [null] }), "distinct");
  });

  test("by: [null]", () => {
    expectNullError(() => users().groupBy({ by: [null] }), "by");
  });

  test("where の AND: [null]", () => {
    expectNullError(() => users().findMany({ where: { AND: [null] } }), "AND");
  });

  test("where の OR: [null]", () => {
    expectNullError(() => users().findMany({ where: { OR: [null] } }), "OR");
  });

  test("createMany の data: [null]", () => {
    expectNullError(() => users().createMany({ data: [null] }), "data");
  });

  test("orderBy: [null] は従来どおり GassmaInvalidValueError", () => {
    expect(() => users().findMany({ orderBy: [null] })).toThrow(
      GassmaInvalidValueError,
    );
  });
});

describe("where の中の構造位置の null はエラー", () => {
  test("AND: null", () => {
    expectNullError(() => users().findMany({ where: { AND: null } }), "AND");
  });

  test("OR: null", () => {
    expectNullError(() => users().findMany({ where: { OR: null } }), "OR");
  });

  test("NOT: null", () => {
    expectNullError(() => users().findMany({ where: { NOT: null } }), "NOT");
  });

  test("入れ子の AND の中の OR: null", () => {
    expectNullError(
      () => users().findMany({ where: { AND: [{ OR: null }] } }),
      "OR",
    );
  });

  test("to-many リレーションの some: null", () => {
    expectNullError(
      () => users().findMany({ where: { posts: { some: null } } }),
      "some",
    );
  });

  test("to-many リレーションの every: null", () => {
    expectNullError(
      () => users().findMany({ where: { posts: { every: null } } }),
      "every",
    );
  });

  test("to-many リレーションの none: null", () => {
    expectNullError(
      () => users().findMany({ where: { posts: { none: null } } }),
      "none",
    );
  });

  test("some の中の AND: null", () => {
    expectNullError(
      () => users().findMany({ where: { posts: { some: { AND: null } } } }),
      "AND",
    );
  });

  test("contains: null", () => {
    expectNullError(
      () => users().findMany({ where: { name: { contains: null } } }),
      "contains",
    );
  });

  test("startsWith: null", () => {
    expectNullError(
      () => users().findMany({ where: { name: { startsWith: null } } }),
      "startsWith",
    );
  });

  test("endsWith: null", () => {
    expectNullError(
      () => users().findMany({ where: { name: { endsWith: null } } }),
      "endsWith",
    );
  });

  test("gt: null", () => {
    expectNullError(
      () => users().findMany({ where: { age: { gt: null } } }),
      "gt",
    );
  });

  test("gte / lt / lte: null", () => {
    expectNullError(
      () => users().findMany({ where: { age: { gte: null } } }),
      "gte",
    );
    expectNullError(
      () => users().findMany({ where: { age: { lt: null } } }),
      "lt",
    );
    expectNullError(
      () => users().findMany({ where: { age: { lte: null } } }),
      "lte",
    );
  });

  test("deleteMany の where の中の contains: null でも全件削除しない", () => {
    const loose = users();
    expectNullError(
      () => loose.deleteMany({ where: { name: { contains: null } } }),
      "contains",
    );
    expect(loose.findMany()).toHaveLength(3);
  });

  test("having の中の集計演算子の null", () => {
    expectNullError(
      () =>
        users().groupBy({
          by: ["name"],
          having: { age: { _count: { gt: null } } },
        }),
      "gt",
    );
  });

  test("to-many リレーションへの null は従来どおりリレーションのエラー", () => {
    expect(() => users().findMany({ where: { posts: null } })).toThrow(
      WhereRelationInvalidFilterError,
    );
  });
});

describe("cursor の中の null はエラー", () => {
  test("cursor: { id: null }", () => {
    expectNullError(() => users().findMany({ cursor: { id: null } }), "id");
  });
});

describe("nested write の動詞の null はエラー", () => {
  test("create の中の create: null", () => {
    expectNullError(
      () =>
        users().create({
          data: { id: 9, name: "X", age: 1, posts: { create: null } },
        }),
      "create",
    );
  });

  test("create の中の connect: null", () => {
    expectNullError(
      () =>
        users().create({
          data: { id: 9, name: "X", age: 1, posts: { connect: null } },
        }),
      "connect",
    );
  });

  test("create の中の connectOrCreate: null", () => {
    expectNullError(
      () =>
        users().create({
          data: { id: 9, name: "X", age: 1, posts: { connectOrCreate: null } },
        }),
      "connectOrCreate",
    );
  });

  test("connectOrCreate の中の create: null", () => {
    expectNullError(
      () =>
        users().create({
          data: {
            id: 9,
            name: "X",
            age: 1,
            posts: { connectOrCreate: { where: { id: 101 }, create: null } },
          },
        }),
      "create",
    );
  });

  test("update の中の set: null", () => {
    expectNullError(
      () =>
        users().update({ where: { id: 1 }, data: { posts: { set: null } } }),
      "set",
    );
  });

  test("update の中の disconnect: null", () => {
    expectNullError(
      () =>
        users().update({
          where: { id: 1 },
          data: { posts: { disconnect: null } },
        }),
      "disconnect",
    );
  });

  test("update の中の delete: null", () => {
    expectNullError(
      () =>
        users().update({ where: { id: 1 }, data: { posts: { delete: null } } }),
      "delete",
    );
  });

  test("update の中の deleteMany: null", () => {
    expectNullError(
      () =>
        users().update({
          where: { id: 1 },
          data: { posts: { deleteMany: null } },
        }),
      "deleteMany",
    );
  });

  test("update の中の updateMany: null", () => {
    expectNullError(
      () =>
        users().update({
          where: { id: 1 },
          data: { posts: { updateMany: null } },
        }),
      "updateMany",
    );
  });

  test("update の中の update: null", () => {
    expectNullError(
      () =>
        users().update({ where: { id: 1 }, data: { posts: { update: null } } }),
      "update",
    );
  });

  test("動詞の配列要素の null", () => {
    expectNullError(
      () =>
        users().update({
          where: { id: 1 },
          data: { posts: { connect: [null] } },
        }),
      "connect",
    );
  });
});

describe("数値操作の null はエラー", () => {
  test("increment: null", () => {
    expectNullError(
      () =>
        users().update({
          where: { id: 1 },
          data: { age: { increment: null } },
        }),
      "increment",
    );
  });

  test("decrement / multiply / divide: null", () => {
    expectNullError(
      () =>
        users().update({
          where: { id: 1 },
          data: { age: { decrement: null } },
        }),
      "decrement",
    );
    expectNullError(
      () =>
        users().update({ where: { id: 1 }, data: { age: { multiply: null } } }),
      "multiply",
    );
    expectNullError(
      () =>
        users().update({ where: { id: 1 }, data: { age: { divide: null } } }),
      "divide",
    );
  });
});

describe("値の位置の null は従来どおり有効", () => {
  test("where: { col: null }", () => {
    expect(users().findMany({ where: { name: null } })).toEqual([]);
  });

  test("where: { col: { equals: null } }", () => {
    expect(users().findMany({ where: { name: { equals: null } } })).toEqual([]);
  });

  test("where: { col: { not: null } }", () => {
    expect(users().findMany({ where: { name: { not: null } } })).toHaveLength(
      3,
    );
  });

  test("to-one リレーションの null / is / isNot", () => {
    expect(posts().findMany({ where: { author: null } })).toEqual([]);
    expect(posts().findMany({ where: { author: { is: null } } })).toEqual([]);
    expect(
      posts().findMany({ where: { author: { isNot: null } } }),
    ).toHaveLength(2);
  });

  test("to-one リレーションの中の列の null", () => {
    expect(posts().findMany({ where: { author: { name: null } } })).toEqual([]);
  });

  test("data: { col: null }", () => {
    const loose = users();
    expect(loose.update({ where: { id: 1 }, data: { age: null } })).toEqual({
      id: 1,
      name: "Alice",
      age: null,
    });
  });

  test("create の data の列の null", () => {
    const loose = users();
    expect(loose.create({ data: { id: 9, name: "Zed", age: null } })).toEqual({
      id: 9,
      name: "Zed",
      age: null,
    });
  });

  test("having: { col: null }", () => {
    expect(users().groupBy({ by: ["age"], having: { age: null } })).toEqual([]);
  });

  test("in / notIn の null は今回の対象外で従来どおり", () => {
    expect(users().findMany({ where: { age: { in: [null] } } })).toEqual([]);
  });

  test("select / include / omit の null は従来どおり無視", () => {
    expect(users().findMany({ select: null })).toHaveLength(3);
    expect(posts().findMany({ include: null })).toHaveLength(2);
    expect(users().findMany({ omit: null })).toHaveLength(3);
  });

  test("nested write の中の子の列の null", () => {
    const loose = users();
    const created = loose.create({
      data: {
        id: 9,
        name: "Zed",
        age: 1,
        posts: { create: { id: 900, title: null } },
      },
    });
    expect(created.id).toBe(9);
  });
});
