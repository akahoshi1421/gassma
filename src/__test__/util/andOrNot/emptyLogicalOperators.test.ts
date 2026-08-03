import { GassmaInvalidValueError } from "../../../errors/argument/argumentError";
import { buildTestClient, sheetOf } from "../extends/extendsTestClient";
import { clearGasGlobals } from "../transaction/transactionTestClient";

afterEach(() => {
  clearGasGlobals();
});

const looseUsers = (): any => {
  const typed = sheetOf(buildTestClient(), "Users");
  const loose: any = typed;
  return loose;
};

const names = (rows: { name: string }[]) => rows.map((row) => row.name);

describe("論理演算子の空指定", () => {
  test("where: {} は全件", () => {
    const users = looseUsers();
    expect(names(users.findMany({ where: {} }))).toEqual([
      "Alice",
      "Bob",
      "Carol",
    ]);
  });

  test("NOT: {} は全件", () => {
    const users = looseUsers();
    expect(names(users.findMany({ where: { NOT: {} } }))).toEqual([
      "Alice",
      "Bob",
      "Carol",
    ]);
  });

  test("NOT: [] は全件", () => {
    const users = looseUsers();
    expect(names(users.findMany({ where: { NOT: [] } }))).toEqual([
      "Alice",
      "Bob",
      "Carol",
    ]);
  });

  test("AND: {} は全件", () => {
    const users = looseUsers();
    expect(names(users.findMany({ where: { AND: {} } }))).toEqual([
      "Alice",
      "Bob",
      "Carol",
    ]);
  });

  test("AND: [] は全件", () => {
    const users = looseUsers();
    expect(names(users.findMany({ where: { AND: [] } }))).toEqual([
      "Alice",
      "Bob",
      "Carol",
    ]);
  });

  test("OR: [] は0件", () => {
    const users = looseUsers();
    expect(users.findMany({ where: { OR: [] } })).toEqual([]);
  });

  test("OR: {} は GassmaInvalidValueError", () => {
    const users = looseUsers();
    const fn = () => users.findMany({ where: { OR: {} } });
    expect(fn).toThrow(GassmaInvalidValueError);
    expect(fn).toThrow("Invalid value for argument `OR`.");
  });
});

describe("条件を持たないブランチは論理配列から取り除かれる（Prisma 実測準拠）", () => {
  test("OR: [{}] は空 OR 扱いで0件", () => {
    const users = looseUsers();
    expect(users.findMany({ where: { OR: [{}] } })).toEqual([]);
  });

  test("OR: [{}, 実条件] は実条件だけ生きる", () => {
    const users = looseUsers();
    expect(
      names(users.findMany({ where: { OR: [{}, { name: "Alice" }] } })),
    ).toEqual(["Alice"]);
  });

  test("OR: [{ age: {} }] も空ブランチ扱いで0件", () => {
    const users = looseUsers();
    expect(users.findMany({ where: { OR: [{ age: {} }] } })).toEqual([]);
  });

  test("OR: [{ age: {} }, 実条件] は実条件だけ生きる", () => {
    const users = looseUsers();
    expect(
      names(
        users.findMany({ where: { OR: [{ age: {} }, { name: "Alice" }] } }),
      ),
    ).toEqual(["Alice"]);
  });

  test("AND: [{ age: {} }] は全件", () => {
    const users = looseUsers();
    expect(users.findMany({ where: { AND: [{ age: {} }] } })).toHaveLength(3);
  });

  test("NOT: [{ age: {} }] は全件", () => {
    const users = looseUsers();
    expect(users.findMany({ where: { NOT: [{ age: {} }] } })).toHaveLength(3);
  });
});

describe("論理演算子の空指定とフィールド条件の併用", () => {
  test("フィールド条件 + AND: {} はフィールド条件のみ適用", () => {
    const users = looseUsers();
    expect(
      names(users.findMany({ where: { name: "Alice", AND: {} } })),
    ).toEqual(["Alice"]);
  });

  test("フィールド条件 + NOT: [] はフィールド条件のみ適用", () => {
    const users = looseUsers();
    expect(
      names(users.findMany({ where: { age: { gte: 30 }, NOT: [] } })),
    ).toEqual(["Bob", "Carol"]);
  });

  test("フィールド条件 + OR: [] は0件", () => {
    const users = looseUsers();
    expect(users.findMany({ where: { name: "Alice", OR: [] } })).toEqual([]);
  });

  test("OR: [] + NOT は0件", () => {
    const users = looseUsers();
    expect(
      users.findMany({ where: { OR: [], NOT: [{ name: "Alice" }] } }),
    ).toEqual([]);
  });
});

describe("論理演算子の空指定のネスト", () => {
  test("NOT: { OR: [] } は全件", () => {
    const users = looseUsers();
    expect(names(users.findMany({ where: { NOT: { OR: [] } } }))).toEqual([
      "Alice",
      "Bob",
      "Carol",
    ]);
  });

  test("AND: [{ OR: [] }] は全件（条件ゼロブランチは捨てられる）", () => {
    const users = looseUsers();
    expect(users.findMany({ where: { AND: [{ OR: [] }] } })).toHaveLength(3);
  });

  test("AND: { OR: [] } 単体形も全件", () => {
    const users = looseUsers();
    expect(users.findMany({ where: { AND: { OR: [] } } })).toHaveLength(3);
  });

  test("AND: [{ OR: [] }, 実条件] は実条件だけ生きる", () => {
    const users = looseUsers();
    expect(
      names(
        users.findMany({ where: { AND: [{ OR: [] }, { name: "Alice" }] } }),
      ),
    ).toEqual(["Alice"]);
  });

  test("NOT: [{ OR: [] }] は全件", () => {
    const users = looseUsers();
    expect(users.findMany({ where: { NOT: [{ OR: [] }] } })).toHaveLength(3);
  });

  test("AND: [{ OR: [{}] }] も全件（全ブランチ条件ゼロの OR は捨てられる）", () => {
    const users = looseUsers();
    expect(users.findMany({ where: { AND: [{ OR: [{}] }] } })).toHaveLength(3);
  });

  test("AND: [{ OR: [実条件] }] は実条件が生きる", () => {
    const users = looseUsers();
    expect(
      users.findMany({ where: { AND: [{ OR: [{ name: "Zed" }] }] } }),
    ).toEqual([]);
  });

  test("OR: [{ OR: {} }] は単体 dict 形なので GassmaInvalidValueError（Prisma も同様にエラー）", () => {
    const users = looseUsers();
    expect(() => users.findMany({ where: { OR: [{ OR: {} }] } })).toThrow(
      GassmaInvalidValueError,
    );
  });

  test("ネストした OR: {} も GassmaInvalidValueError", () => {
    const users = looseUsers();
    const fn = () => users.findMany({ where: { AND: [{ OR: {} }] } });
    expect(fn).toThrow(GassmaInvalidValueError);
  });
});

describe("論理キーだけで条件ゼロになるブランチも取り除かれる（Prisma 実測準拠）", () => {
  test("OR: [{ AND: [] }] は空 OR 扱いで0件", () => {
    const users = looseUsers();
    expect(users.findMany({ where: { OR: [{ AND: [] }] } })).toEqual([]);
  });

  test("OR: [{ AND: [{}] }] も0件", () => {
    const users = looseUsers();
    expect(users.findMany({ where: { OR: [{ AND: [{}] }] } })).toEqual([]);
  });

  test("OR: [{ AND: [{ age: {} }] }] も0件", () => {
    const users = looseUsers();
    expect(users.findMany({ where: { OR: [{ AND: [{ age: {} }] }] } })).toEqual(
      [],
    );
  });

  test("OR: [{ NOT: [] }] / [{ NOT: {} }] / [{ NOT: { age: {} } }] は0件", () => {
    const users = looseUsers();
    expect(users.findMany({ where: { OR: [{ NOT: [] }] } })).toEqual([]);
    expect(users.findMany({ where: { OR: [{ NOT: {} }] } })).toEqual([]);
    expect(users.findMany({ where: { OR: [{ NOT: { age: {} } }] } })).toEqual(
      [],
    );
  });

  test("深い入れ子でも条件ゼロなら捨てられる", () => {
    const users = looseUsers();
    expect(users.findMany({ where: { OR: [{ AND: [{ NOT: [] }] }] } })).toEqual(
      [],
    );
    expect(
      users.findMany({ where: { OR: [{ AND: [{ AND: [{}] }] }] } }),
    ).toEqual([]);
  });

  test("条件ゼロのブランチと実条件の併存では実条件だけ生きる", () => {
    const users = looseUsers();
    expect(
      names(
        users.findMany({ where: { OR: [{ AND: [] }, { name: "Alice" }] } }),
      ),
    ).toEqual(["Alice"]);
  });

  test("実条件を含む AND ブランチは捨てられない", () => {
    const users = looseUsers();
    expect(
      names(users.findMany({ where: { OR: [{ AND: [{ name: "Alice" }] }] } })),
    ).toEqual(["Alice"]);
  });

  test("条件ゼロの論理キーとフィールド実条件が混在するブランチは実条件として生きる", () => {
    const users = looseUsers();
    expect(
      names(users.findMany({ where: { OR: [{ AND: [], name: "Alice" }] } })),
    ).toEqual(["Alice"]);
  });

  test("NOT: [{ AND: [] }] / NOT: { AND: [] } は全件", () => {
    const users = looseUsers();
    expect(users.findMany({ where: { NOT: [{ AND: [] }] } })).toHaveLength(3);
    expect(users.findMany({ where: { NOT: { AND: [] } } })).toHaveLength(3);
  });

  test("NOT: [条件ゼロ, 実条件] は実条件だけ否定される", () => {
    const users = looseUsers();
    expect(
      names(
        users.findMany({ where: { NOT: [{ age: {} }, { name: "Alice" }] } }),
      ),
    ).toEqual(["Bob", "Carol"]);
  });

  test("AND: [{ AND: [] }] は全件", () => {
    const users = looseUsers();
    expect(users.findMany({ where: { AND: [{ AND: [] }] } })).toHaveLength(3);
  });

  test("OR: [{ OR: [] }] は0件・実条件と併存なら実条件だけ生きる", () => {
    const users = looseUsers();
    expect(users.findMany({ where: { OR: [{ OR: [] }] } })).toEqual([]);
    expect(
      names(users.findMany({ where: { OR: [{ OR: [] }, { name: "Alice" }] } })),
    ).toEqual(["Alice"]);
  });
});

describe("論理演算子の undefined は無視される", () => {
  test("AND: undefined は全件", () => {
    const users = looseUsers();
    expect(names(users.findMany({ where: { AND: undefined } }))).toEqual([
      "Alice",
      "Bob",
      "Carol",
    ]);
  });

  test("OR: undefined は全件", () => {
    const users = looseUsers();
    expect(names(users.findMany({ where: { OR: undefined } }))).toEqual([
      "Alice",
      "Bob",
      "Carol",
    ]);
  });

  test("NOT: undefined は全件", () => {
    const users = looseUsers();
    expect(names(users.findMany({ where: { NOT: undefined } }))).toEqual([
      "Alice",
      "Bob",
      "Carol",
    ]);
  });
});

describe("空指定でも count / deleteMany 系の where と一貫する", () => {
  test("count で OR: [] は 0", () => {
    const users = looseUsers();
    expect(users.count({ where: { OR: [] } })).toBe(0);
  });

  test("count で NOT: {} は全件", () => {
    const users = looseUsers();
    expect(users.count({ where: { NOT: {} } })).toBe(3);
  });
});
