import { raw } from "../../../util/raw/raw";
import {
  buildTestClient,
  clearSpreadsheetApp,
  sheetOf,
} from "../extends/extendsTestClient";
import {
  buildTxTestEnv,
  clearGasGlobals,
} from "../transaction/transactionTestClient";

afterEach(() => {
  clearSpreadsheetApp();
  clearGasGlobals();
  jest.restoreAllMocks();
});

describe("create の戻り値", () => {
  it("raw カラムは数式文字列でアンラップされ非 raw カラムは従来どおり入力エコー", () => {
    const users = sheetOf(buildTestClient(), "Users");

    const created = users.create({
      data: { id: 4, name: raw("=SUM(A1:A2)"), age: "=danger" },
    });

    expect(created).toEqual({ id: 4, name: "=SUM(A1:A2)", age: "=danger" });
  });

  it("数値カラムへの raw も戻り値は数式文字列(エコーであり計算結果ではない)", () => {
    const users = sheetOf(buildTestClient(), "Users");

    const created = users.create({
      data: { id: 5, name: "x", age: raw("=SUM(A1:A2)") },
    });

    expect(created).toEqual({ id: 5, name: "x", age: "=SUM(A1:A2)" });
  });
});

describe("createManyAndReturn の戻り値", () => {
  it("raw カラムはアンラップされ他の行・カラムは従来どおり", () => {
    const users = sheetOf(buildTestClient(), "Users");

    const created = users.createManyAndReturn({
      data: [
        { id: 6, name: raw("=A1"), age: 1 },
        { id: 7, name: "=A1", age: 2 },
      ],
    });

    expect(created).toEqual([
      { id: 6, name: "=A1", age: 1 },
      { id: 7, name: "=A1", age: 2 },
    ]);
  });
});

describe("update / updateManyAndReturn の戻り値", () => {
  it("update の戻り値の raw カラムはアンラップされる", () => {
    const users = sheetOf(buildTestClient(), "Users");

    const updated = users.update({
      where: { id: 1 },
      data: { name: raw("=NOW()") },
    });

    expect(updated).toEqual({ id: 1, name: "=NOW()", age: 20 });
  });

  it("updateManyAndReturn の戻り値の raw カラムは全行アンラップされる", () => {
    const users = sheetOf(buildTestClient(), "Users");

    const updated = users.updateManyAndReturn({
      where: {},
      data: { name: raw("=RAND()") },
    });

    expect(updated).toHaveLength(3);
    updated.forEach((record) => {
      expect(record).toMatchObject({ name: "=RAND()" });
    });
  });
});

describe("upsert の戻り値", () => {
  it("update 分岐の戻り値の raw カラムはアンラップされる", () => {
    const users = sheetOf(buildTestClient(), "Users");

    const upserted = users.upsert({
      where: { id: 2 },
      create: { id: 2, name: "none", age: 0 },
      update: { name: raw("=U1") },
    });

    expect(upserted).toEqual({ id: 2, name: "=U1", age: 30 });
  });

  it("create 分岐の戻り値の raw カラムはアンラップされる", () => {
    const users = sheetOf(buildTestClient(), "Users");

    const upserted = users.upsert({
      where: { id: 99 },
      create: { id: 99, name: raw("=C1"), age: 0 },
      update: {},
    });

    expect(upserted).toEqual({ id: 99, name: "=C1", age: 0 });
  });
});

describe("nested write の戻り値", () => {
  it("nested create を伴う create の戻り値でも親の raw カラムはアンラップされる", () => {
    const client = buildTestClient({ relations: true });
    const users: any = sheetOf(client, "Users");

    const created = users.create({
      data: {
        id: 8,
        name: raw("=P1"),
        age: 1,
        posts: { create: { id: 103, title: "t" } },
      },
    });

    expect(created).toMatchObject({ id: 8, name: "=P1" });
  });

  it("nested create を伴う update の戻り値でも親の raw カラムはアンラップされる", () => {
    const client = buildTestClient({ relations: true });
    const posts: any = sheetOf(client, "Posts");

    const updated = posts.update({
      where: { id: 101 },
      data: {
        title: raw("=SUM(B:B)"),
        comments: { create: { id: 1004, body: "c" } },
      },
    });

    expect(updated).toMatchObject({ id: 101, title: "=SUM(B:B)" });
  });
});

describe("$transaction 内の戻り値", () => {
  test("tx 内 create の戻り値も raw は数式文字列(シート側は数式として評価)", () => {
    const env = buildTxTestEnv();

    env.client.$transaction((tx) => {
      const created = tx.Users.create({
        data: { id: 3, name: raw("=SUM(A1:A2)"), age: 40 },
      });
      expect(created).toEqual({ id: 3, name: "=SUM(A1:A2)", age: 40 });
    });

    expect(env.users.snapshot()[3]).toEqual([3, "#MOCK(=SUM(A1:A2))", 40]);
  });

  test("tx 内 update の戻り値も raw は数式文字列", () => {
    const env = buildTxTestEnv();

    env.client.$transaction((tx) => {
      const updated = tx.Users.update({
        where: { id: 1 },
        data: { name: raw("=NOW()") },
      });
      expect(updated).toEqual({ id: 1, name: "=NOW()", age: 20 });
    });
  });
});
