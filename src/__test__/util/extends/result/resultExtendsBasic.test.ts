import {
  buildTestClient,
  clearSpreadsheetApp,
  sheetOf,
} from "../extendsTestClient";

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

describe("$extends result: 基本動作", () => {
  test("findMany の各レコードに算出フィールドが付く", () => {
    const client = buildTestClient();
    const extended = client.$extends(fullNameExtension);
    expect(extended.Users.findMany({})).toEqual([
      { id: 1, name: "Alice", age: 20, fullName: "Mr. Alice" },
      { id: 2, name: "Bob", age: 30, fullName: "Mr. Bob" },
      { id: 3, name: "Carol", age: 40, fullName: "Mr. Carol" },
    ]);
  });

  test("findFirst / findFirstOrThrow の単体レコードに付く", () => {
    const client = buildTestClient();
    const extended = client.$extends(fullNameExtension);
    expect(extended.Users.findFirst({ where: { id: 2 } })).toEqual({
      id: 2,
      name: "Bob",
      age: 30,
      fullName: "Mr. Bob",
    });
    expect(extended.Users.findFirstOrThrow({ where: { id: 3 } })).toEqual({
      id: 3,
      name: "Carol",
      age: 40,
      fullName: "Mr. Carol",
    });
  });

  test("findFirst で該当なしなら null のまま", () => {
    const client = buildTestClient();
    const extended = client.$extends(fullNameExtension);
    expect(extended.Users.findFirst({ where: { id: 999 } })).toBeNull();
  });

  test("result 定義のないモデルは素通し", () => {
    const client = buildTestClient();
    const extended = client.$extends(fullNameExtension);
    expect(extended.Posts.findMany({})).toEqual([
      { id: 101, authorId: 1, title: "Post A" },
      { id: 102, authorId: 2, title: "Post B" },
    ]);
  });

  test("書き込み系の返却レコードに付く", () => {
    const client = buildTestClient();
    const extended = client.$extends(fullNameExtension);
    expect(
      extended.Users.create({ data: { id: 4, name: "Dave", age: 1 } }),
    ).toEqual({ id: 4, name: "Dave", age: 1, fullName: "Mr. Dave" });
    expect(
      extended.Users.createManyAndReturn({
        data: [{ id: 5, name: "Eve", age: 2 }],
      }),
    ).toEqual([{ id: 5, name: "Eve", age: 2, fullName: "Mr. Eve" }]);
    expect(
      extended.Users.update({ where: { id: 1 }, data: { age: 21 } }),
    ).toEqual({ id: 1, name: "Alice", age: 21, fullName: "Mr. Alice" });
    expect(
      extended.Users.updateManyAndReturn({
        where: { id: 2 },
        data: { age: 31 },
      }),
    ).toEqual([{ id: 2, name: "Bob", age: 31, fullName: "Mr. Bob" }]);
    expect(
      extended.Users.upsert({
        where: { id: 6 },
        create: { id: 6, name: "Frank", age: 3 },
        update: { age: 99 },
      }),
    ).toEqual({ id: 6, name: "Frank", age: 3, fullName: "Mr. Frank" });
    expect(extended.Users.delete({ where: { id: 6 } })).toEqual({
      id: 6,
      name: "Frank",
      age: 3,
      fullName: "Mr. Frank",
    });
  });

  test("レコードを返さない操作には付かない", () => {
    const client = buildTestClient();
    const extended = client.$extends(fullNameExtension);
    expect(extended.Users.count({})).toBe(3);
    expect(extended.Users.aggregate({ _count: { id: true } })).toEqual({
      _count: { id: 3 },
    });
    const grouped = extended.Users.groupBy({ by: "age", _count: { id: true } });
    grouped.forEach((group: Record<string, unknown>) => {
      expect(group).not.toHaveProperty("fullName");
    });
    expect(
      extended.Users.createMany({ data: [{ id: 7, name: "Gina", age: 4 }] }),
    ).toEqual({ count: 1 });
    expect(
      extended.Users.updateMany({ where: { id: 7 }, data: { age: 5 } }),
    ).toEqual({ count: 1 });
    expect(extended.Users.deleteMany({ where: { id: 7 } })).toEqual({
      count: 1,
    });
  });

  test("算出フィールドは eager な通常プロパティ", () => {
    const client = buildTestClient();
    const compute = jest.fn((user: { name: string }) => `Mr. ${user.name}`);
    const extended = client.$extends({
      result: { Users: { fullName: { needs: { name: true }, compute } } },
    });
    const rows = extended.Users.findMany({});
    expect(compute).toHaveBeenCalledTimes(3);
    const descriptor = Object.getOwnPropertyDescriptor(rows[0], "fullName");
    expect(descriptor).toMatchObject({
      value: "Mr. Alice",
      enumerable: true,
      writable: true,
    });
    expect(descriptor?.get).toBeUndefined();
    expect(JSON.parse(JSON.stringify(rows[0])).fullName).toBe("Mr. Alice");
    expect({ ...rows[0] }).toMatchObject({ fullName: "Mr. Alice" });
    expect(rows[0]).toHaveProperty("fullName", "Mr. Alice");
    expect(rows[0]).toHaveProperty("fullName", "Mr. Alice");
    expect(compute).toHaveBeenCalledTimes(3);
  });

  test("元クライアントには影響しない", () => {
    const client = buildTestClient();
    const extended = client.$extends(fullNameExtension);
    void extended;
    expect(sheetOf(client, "Users").findMany({ where: { id: 1 } })).toEqual([
      { id: 1, name: "Alice", age: 20 },
    ]);
  });

  test("操作以外のメンバー（getColumnHeaders / fields）は透過する", () => {
    const client = buildTestClient();
    const extended = client.$extends(fullNameExtension);
    expect(extended.Users.getColumnHeaders()).toEqual(["id", "name", "age"]);
    const ref = extended.Users.fields.age;
    expect(ref.modelName).toBe("Users");
    expect(ref.name).toBe("age");
  });
});
