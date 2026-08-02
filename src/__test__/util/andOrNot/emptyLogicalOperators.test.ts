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

  test("AND: [{ OR: [] }] は0件", () => {
    const users = looseUsers();
    expect(users.findMany({ where: { AND: [{ OR: [] }] } })).toEqual([]);
  });

  test("OR: [{ AND: [] }] は全件", () => {
    const users = looseUsers();
    expect(names(users.findMany({ where: { OR: [{ AND: [] }] } }))).toEqual([
      "Alice",
      "Bob",
      "Carol",
    ]);
  });

  test("ネストした OR: {} も GassmaInvalidValueError", () => {
    const users = looseUsers();
    const fn = () => users.findMany({ where: { AND: [{ OR: {} }] } });
    expect(fn).toThrow(GassmaInvalidValueError);
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
