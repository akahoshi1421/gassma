import { buildTestClient, clearSpreadsheetApp } from "../extendsTestClient";

afterAll(clearSpreadsheetApp);

const fullNameExtension = {
  result: {
    Users: {
      fullName: {
        needs: { name: true },
        compute: (user: { name: string }) => `Mr. ${user.name}`,
      },
    },
  },
};

describe("$extends result: select 連携", () => {
  test("select に算出フィールドを指定すると needs は自動補完され出力からは除去される", () => {
    const client = buildTestClient();
    const extended = client.$extends(fullNameExtension);
    expect(
      extended.Users.findMany({ select: { id: true, fullName: true } }),
    ).toEqual([
      { id: 1, fullName: "Mr. Alice" },
      { id: 2, fullName: "Mr. Bob" },
      { id: 3, fullName: "Mr. Carol" },
    ]);
  });

  test("select に算出フィールドが無ければ出力されず needs も補完されない", () => {
    const client = buildTestClient();
    const extended = client.$extends(fullNameExtension);
    expect(extended.Users.findMany({ select: { id: true } })).toEqual([
      { id: 1 },
      { id: 2 },
      { id: 3 },
    ]);
  });

  test("needs キーがユーザー select に元々ある場合は出力に残る", () => {
    const client = buildTestClient();
    const extended = client.$extends(fullNameExtension);
    expect(
      extended.Users.findFirst({
        where: { id: 1 },
        select: { id: true, name: true, fullName: true },
      }),
    ).toEqual({ id: 1, name: "Alice", fullName: "Mr. Alice" });
  });

  test("select が算出フィールドのみでも動く", () => {
    const client = buildTestClient();
    const extended = client.$extends(fullNameExtension);
    expect(
      extended.Users.findFirst({
        where: { id: 2 },
        select: { fullName: true },
      }),
    ).toEqual({ fullName: "Mr. Bob" });
  });

  test("書き込み系の select でも算出フィールドを選択できる", () => {
    const client = buildTestClient();
    const extended = client.$extends(fullNameExtension);
    expect(
      extended.Users.create({
        data: { id: 4, name: "Dave", age: 1 },
        select: { id: true, fullName: true },
      }),
    ).toEqual({ id: 4, fullName: "Mr. Dave" });
    expect(
      extended.Users.update({
        where: { id: 4 },
        data: { age: 2 },
        select: { fullName: true },
      }),
    ).toEqual({ fullName: "Mr. Dave" });
    expect(
      extended.Users.delete({
        where: { id: 4 },
        select: { id: true, fullName: true },
      }),
    ).toEqual({ id: 4, fullName: "Mr. Dave" });
  });
});

describe("$extends result: omit 連携", () => {
  test("omit で算出フィールドを除去できる", () => {
    const client = buildTestClient();
    const extended = client.$extends(fullNameExtension);
    expect(
      extended.Users.findMany({ where: { id: 1 }, omit: { fullName: true } }),
    ).toEqual([{ id: 1, name: "Alice", age: 20 }]);
  });

  test("needs キーを omit しても compute は full record から計算される", () => {
    const client = buildTestClient();
    const extended = client.$extends(fullNameExtension);
    expect(
      extended.Users.findMany({ where: { id: 1 }, omit: { name: true } }),
    ).toEqual([{ id: 1, age: 20, fullName: "Mr. Alice" }]);
  });

  test("omit が false のキーは除去されない", () => {
    const client = buildTestClient();
    const extended = client.$extends(fullNameExtension);
    expect(
      extended.Users.findFirst({
        where: { id: 2 },
        omit: { name: false, fullName: false },
      }),
    ).toEqual({ id: 2, name: "Bob", age: 30, fullName: "Mr. Bob" });
  });

  test("書き込み系の omit でも needs 除去と算出付与が両立する", () => {
    const client = buildTestClient();
    const extended = client.$extends(fullNameExtension);
    expect(
      extended.Users.create({
        data: { id: 5, name: "Eve", age: 2 },
        omit: { name: true },
      }),
    ).toEqual({ id: 5, age: 2, fullName: "Mr. Eve" });
  });
});
