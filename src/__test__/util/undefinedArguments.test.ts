import { GassmaInvalidValueError } from "../../errors/argument/argumentError";
import { GassmaUndefinedValueError } from "../../errors/skip/skipError";
import { buildTestClient, sheetOf } from "./extends/extendsTestClient";
import { clearGasGlobals } from "./transaction/transactionTestClient";

afterEach(() => {
  clearGasGlobals();
});

const looseSheet = (name: string, relations = false): any => {
  const typed = sheetOf(buildTestClient({ relations }), name);
  const loose: any = typed;
  return loose;
};

const names = (rows: { name: string }[]) => rows.map((row) => row.name);

describe("where のフィールド undefined は条件未指定と同じ（Prisma 実測準拠）", () => {
  test("単独の undefined は全件", () => {
    const users = looseSheet("Users");
    expect(users.findMany({ where: { age: undefined } })).toHaveLength(3);
  });

  test("他の条件と併用なら残りの条件だけ適用", () => {
    const users = looseSheet("Users");
    expect(
      names(users.findMany({ where: { name: "Alice", age: undefined } })),
    ).toEqual(["Alice"]);
  });

  test("findFirst でも同じ", () => {
    const users = looseSheet("Users");
    expect(users.findFirst({ where: { age: undefined } })).toEqual({
      id: 1,
      name: "Alice",
      age: 20,
    });
  });

  test("count でも同じ", () => {
    const users = looseSheet("Users");
    expect(users.count({ where: { age: undefined } })).toBe(3);
  });
});

describe("演算子オブジェクト内の undefined はその演算子だけ無視", () => {
  test("equals: undefined は全件", () => {
    const users = looseSheet("Users");
    expect(
      users.findMany({ where: { age: { equals: undefined } } }),
    ).toHaveLength(3);
  });

  test("一部の演算子だけ undefined なら残りを適用", () => {
    const users = looseSheet("Users");
    expect(
      names(users.findMany({ where: { age: { gt: undefined, lt: 35 } } })),
    ).toEqual(["Alice", "Bob"]);
  });

  test("in: undefined / notIn: undefined は全件", () => {
    const users = looseSheet("Users");
    expect(users.findMany({ where: { age: { in: undefined } } })).toHaveLength(
      3,
    );
    expect(
      users.findMany({ where: { age: { notIn: undefined } } }),
    ).toHaveLength(3);
  });
});

describe("配列要素の undefined はエラー（Prisma 実測準拠）", () => {
  test("in の配列内 undefined は GassmaUndefinedValueError", () => {
    const users = looseSheet("Users");
    const fn = () =>
      users.findMany({ where: { age: { in: [20, undefined] } } });
    expect(fn).toThrow(GassmaUndefinedValueError);
    expect(fn).toThrow("Invalid value for argument `where.age.in[1]`");
  });

  test("notIn の配列内 undefined も同様", () => {
    const users = looseSheet("Users");
    expect(() =>
      users.findMany({ where: { age: { notIn: [20, undefined] } } }),
    ).toThrow(GassmaUndefinedValueError);
  });

  test("AND / OR / NOT の配列内 undefined も同様", () => {
    const users = looseSheet("Users");
    expect(() => users.findMany({ where: { AND: [undefined] } })).toThrow(
      GassmaUndefinedValueError,
    );
    expect(() => users.findMany({ where: { OR: [undefined] } })).toThrow(
      GassmaUndefinedValueError,
    );
    expect(() => users.findMany({ where: { NOT: [undefined] } })).toThrow(
      GassmaUndefinedValueError,
    );
  });

  test("orderBy / distinct の配列内 undefined も同様", () => {
    const users = looseSheet("Users");
    expect(() => users.findMany({ orderBy: [undefined] })).toThrow(
      GassmaUndefinedValueError,
    );
    expect(() => users.findMany({ distinct: [undefined] })).toThrow(
      GassmaUndefinedValueError,
    );
  });
});

describe("論理演算子配下の undefined ブランチ", () => {
  test("AND: [{ age: undefined }] は全件", () => {
    const users = looseSheet("Users");
    expect(
      users.findMany({ where: { AND: [{ age: undefined }] } }),
    ).toHaveLength(3);
  });

  test("OR: [{ age: undefined }] は空ブランチ扱いで0件", () => {
    const users = looseSheet("Users");
    expect(users.findMany({ where: { OR: [{ age: undefined }] } })).toEqual([]);
  });

  test("OR: [{ age: undefined }, 実条件] は実条件だけ生きる", () => {
    const users = looseSheet("Users");
    expect(
      names(
        users.findMany({
          where: { OR: [{ age: undefined }, { name: "Alice" }] },
        }),
      ),
    ).toEqual(["Alice"]);
  });

  test("NOT: { age: undefined } は全件", () => {
    const users = looseSheet("Users");
    expect(users.findMany({ where: { NOT: { age: undefined } } })).toHaveLength(
      3,
    );
  });

  test("NOT: [{ age: { gte: undefined } }] は全件", () => {
    const users = looseSheet("Users");
    expect(
      users.findMany({ where: { NOT: [{ age: { gte: undefined } }] } }),
    ).toHaveLength(3);
  });

  test("入れ子の論理キーごと条件ゼロになる OR ブランチは捨てられる", () => {
    const users = looseSheet("Users");
    expect(
      users.findMany({ where: { OR: [{ AND: [{ age: undefined }] }] } }),
    ).toEqual([]);
    expect(
      names(
        users.findMany({
          where: { OR: [{ AND: [{ age: undefined }] }, { name: "Alice" }] },
        }),
      ),
    ).toEqual(["Alice"]);
  });
});

describe("リレーションフィルタの undefined", () => {
  test("some: undefined はフィルタごと無視", () => {
    const users = looseSheet("Users", true);
    expect(
      users.findMany({ where: { posts: { some: undefined } } }),
    ).toHaveLength(3);
  });

  test("some の中の undefined は some: {} と同じ（存在チェック）", () => {
    const users = looseSheet("Users", true);
    expect(
      names(
        users.findMany({ where: { posts: { some: { title: undefined } } } }),
      ),
    ).toEqual(["Alice", "Bob"]);
  });

  test("is: undefined / isNot: undefined はフィルタごと無視", () => {
    const posts = looseSheet("Posts", true);
    expect(
      posts.findMany({ where: { author: { is: undefined } } }),
    ).toHaveLength(2);
    expect(
      posts.findMany({ where: { author: { isNot: undefined } } }),
    ).toHaveLength(2);
  });
});

describe("cursor の undefined", () => {
  test("cursor: { id: undefined } は GassmaInvalidValueError", () => {
    const users = looseSheet("Users");
    const fn = () =>
      users.findMany({ cursor: { id: undefined }, orderBy: { id: "asc" } });
    expect(fn).toThrow(GassmaInvalidValueError);
    expect(fn).toThrow("Invalid value for argument `cursor`.");
  });

  test("cursor: undefined は cursor 未指定と同じ", () => {
    const users = looseSheet("Users");
    expect(users.findMany({ cursor: undefined })).toHaveLength(3);
  });

  test("リテラルの cursor: {} も同じエラー（Prisma 実測準拠）", () => {
    const users = looseSheet("Users");
    expect(() => users.findMany({ cursor: {}, take: 2 })).toThrow(
      GassmaInvalidValueError,
    );
  });
});

describe("orderBy の undefined", () => {
  test("orderBy: { age: undefined } は並び替えなし", () => {
    const users = looseSheet("Users");
    expect(names(users.findMany({ orderBy: { age: undefined } }))).toEqual([
      "Alice",
      "Bob",
      "Carol",
    ]);
  });

  test("配列内の { age: undefined } エントリは無視され残りで並ぶ", () => {
    const users = looseSheet("Users");
    expect(
      names(users.findMany({ orderBy: [{ age: undefined }, { id: "desc" }] })),
    ).toEqual(["Carol", "Bob", "Alice"]);
  });

  test("orderBy: {} は並び替えなし", () => {
    const users = looseSheet("Users");
    expect(users.findMany({ orderBy: {} })).toHaveLength(3);
  });

  test("orderBy: undefined は未指定と同じ", () => {
    const users = looseSheet("Users");
    expect(users.findMany({ orderBy: undefined })).toHaveLength(3);
  });
});

describe("select / distinct / take / skip の undefined", () => {
  test("select の一部キーが undefined ならそのキーだけ落ちる", () => {
    const users = looseSheet("Users");
    expect(users.findMany({ select: { name: true, age: undefined } })).toEqual([
      { name: "Alice" },
      { name: "Bob" },
      { name: "Carol" },
    ]);
  });

  test("select の全キーが undefined なら GassmaInvalidValueError", () => {
    const users = looseSheet("Users");
    const fn = () => users.findMany({ select: { age: undefined } });
    expect(fn).toThrow(GassmaInvalidValueError);
    expect(fn).toThrow("Invalid value for argument `select`.");
  });

  test("リテラルの select: {} も同じエラー（Prisma 実測準拠）", () => {
    const users = looseSheet("Users");
    expect(() => users.findMany({ select: {} })).toThrow(
      GassmaInvalidValueError,
    );
    expect(() =>
      users.update({ where: { id: 1 }, select: {}, data: { age: 21 } }),
    ).toThrow(GassmaInvalidValueError);
  });

  test("キーが1つでも残る select は通る", () => {
    const users = looseSheet("Users");
    expect(users.findMany({ select: { name: true } })).toHaveLength(3);
  });

  test("distinct: undefined / take: undefined / skip: undefined は未指定と同じ", () => {
    const users = looseSheet("Users");
    expect(
      users.findMany({ distinct: undefined, take: undefined, skip: undefined }),
    ).toHaveLength(3);
  });
});

describe("groupBy having の undefined", () => {
  test("having のフィールド undefined はフィルタなし", () => {
    const users = looseSheet("Users");
    expect(
      users.groupBy({
        by: ["age"],
        having: { age: undefined },
        _count: { _all: true },
      }),
    ).toHaveLength(3);
  });

  test("having の演算子 undefined はその演算子だけ無視", () => {
    const users = looseSheet("Users");
    expect(
      users.groupBy({
        by: ["age"],
        having: { age: { equals: undefined } },
        _count: { _all: true },
      }),
    ).toHaveLength(3);
  });

  test("having で実条件が残れば適用される", () => {
    const users = looseSheet("Users");
    const result = users.groupBy({
      by: ["age"],
      having: { age: { equals: 20, gt: undefined } },
      _count: { _all: true },
    });
    expect(result).toEqual([{ age: 20, _count: { _all: 1 } }]);
  });
});

describe("update / delete / upsert の where が undefined だけで空になる場合", () => {
  test("update は GassmaInvalidValueError", () => {
    const users = looseSheet("Users");
    const fn = () =>
      users.update({ where: { id: undefined }, data: { age: 99 } });
    expect(fn).toThrow(GassmaInvalidValueError);
    expect(fn).toThrow("Invalid value for argument `where`.");
  });

  test("delete も同様", () => {
    const users = looseSheet("Users");
    expect(() => users.delete({ where: { id: undefined } })).toThrow(
      GassmaInvalidValueError,
    );
  });

  test("upsert も同様", () => {
    const users = looseSheet("Users");
    expect(() =>
      users.upsert({
        where: { id: undefined },
        create: { id: 4, name: "Dave", age: 50 },
        update: { age: 50 },
      }),
    ).toThrow(GassmaInvalidValueError);
  });

  test("実条件が残る update は通る", () => {
    const users = looseSheet("Users");
    const result = users.update({
      where: { id: 1, name: undefined },
      data: { age: 21 },
    });
    expect(result).toEqual({ id: 1, name: "Alice", age: 21 });
  });
});

describe("updateMany / deleteMany の where の undefined は全件対象（Prisma 実測準拠）", () => {
  test("updateMany({ where: { age: undefined } }) は全件更新", () => {
    const users = looseSheet("Users");
    const result = users.updateMany({
      where: { age: undefined },
      data: { age: 99 },
    });
    expect(result).toEqual({ count: 3 });
  });

  test("deleteMany({ where: { age: undefined } }) は全件削除", () => {
    const users = looseSheet("Users");
    const result = users.deleteMany({ where: { age: undefined } });
    expect(result).toEqual({ count: 3 });
    expect(users.count({})).toBe(0);
  });
});

describe("data の undefined はフィールド未指定と同じ（Prisma 実測準拠）", () => {
  test("update の data の undefined フィールドは更新されない", () => {
    const users = looseSheet("Users");
    const result = users.update({
      where: { id: 1 },
      data: { name: undefined, age: 21 },
    });
    expect(result).toEqual({ id: 1, name: "Alice", age: 21 });
  });

  test("create の data の undefined フィールドは未指定と同じ", () => {
    const users = looseSheet("Users");
    const result = users.create({
      data: { id: 4, name: "Dave", age: undefined },
    });
    expect(result).toEqual({ id: 4, name: "Dave", age: null });
  });
});
