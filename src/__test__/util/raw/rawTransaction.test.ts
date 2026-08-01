import { raw } from "../../../util/raw/raw";
import {
  buildTxTestEnv,
  clearGasGlobals,
} from "../transaction/transactionTestClient";

afterEach(() => {
  clearGasGlobals();
  jest.restoreAllMocks();
});

describe("$transaction と raw", () => {
  test("tx 内の raw create は flush 後に生のまま書かれる", () => {
    const env = buildTxTestEnv();

    env.client.$transaction((tx) => {
      tx.Users.create({
        data: { id: 3, name: raw("=SUM(A1:A2)"), age: "=danger" },
      });
      expect(env.users.writes).toEqual([]);
    });

    expect(env.users.snapshot()).toEqual([
      ["id", "name", "age"],
      [1, "Alice", 20],
      [2, "Bob", 30],
      [3, "#MOCK(=SUM(A1:A2))", "'=danger"],
    ]);
    expect(env.users.formulaSnapshot()[3]).toEqual(["", "=SUM(A1:A2)", ""]);
  });

  test("tx 内の raw update は flush 後に生のまま書かれる", () => {
    const env = buildTxTestEnv();

    env.client.$transaction((tx) => {
      tx.Users.update({ where: { id: 1 }, data: { name: raw("=NOW()") } });
    });

    expect(env.users.snapshot()[1]).toEqual([1, "#MOCK(=NOW())", 20]);
    expect(env.users.formulaSnapshot()[1]).toEqual(["", "=NOW()", ""]);
  });

  test("read-your-writes では raw 値は文字列のまま見える", () => {
    const env = buildTxTestEnv();

    env.client.$transaction((tx) => {
      tx.Users.create({
        data: { id: 3, name: raw("=SUM(A1:A2)"), age: "=danger" },
      });

      expect(tx.Users.findFirst({ where: { id: 3 } })).toMatchObject({
        name: "=SUM(A1:A2)",
        age: "'=danger",
      });
    });
  });

  test("rollback 時は raw を含む書き込みもシートに反映されない", () => {
    const env = buildTxTestEnv();

    expect(() =>
      env.client.$transaction((tx) => {
        tx.Users.create({ data: { id: 3, name: raw("=SUM(A1:A2)"), age: 0 } });
        throw new Error("boom");
      }),
    ).toThrow("boom");

    expect(env.users.snapshot()).toEqual([
      ["id", "name", "age"],
      [1, "Alice", 20],
      [2, "Bob", 30],
    ]);
  });
});
