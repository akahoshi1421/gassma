import {
  buildTestClient,
  clearSpreadsheetApp,
  sheetOf,
} from "../extendsTestClient";

afterAll(clearSpreadsheetApp);

describe("$extends query: 基本動作", () => {
  test("フックは model / operation / args を受け取り query(args) で実結果を得る", () => {
    const client = buildTestClient();
    const received: { model?: string; operation?: string; args?: unknown } = {};
    const extended = client.$extends({
      query: {
        Users: {
          findMany({ model, operation, args, query }) {
            received.model = model;
            received.operation = operation;
            received.args = args;
            return query(args);
          },
        },
      },
    });
    const result = extended.Users.findMany({ where: { age: 20 } });
    expect(received.model).toBe("Users");
    expect(received.operation).toBe("findMany");
    expect(received.args).toEqual({ where: { age: 20 } });
    expect(result).toEqual([{ id: 1, name: "Alice", age: 20 }]);
  });

  test("フックで args を改変できる", () => {
    const client = buildTestClient();
    const extended = client.$extends({
      query: {
        Users: {
          findMany({ args, query }) {
            return query({ ...args, where: { name: "Bob" } });
          },
        },
      },
    });
    expect(extended.Users.findMany({})).toEqual([
      { id: 2, name: "Bob", age: 30 },
    ]);
  });

  test("フックで結果を加工できる", () => {
    const client = buildTestClient();
    const extended = client.$extends({
      query: {
        Users: {
          findMany({ args, query }) {
            const result = query(args);
            return result.map((row: Record<string, unknown>) => ({
              ...row,
              extra: true,
            }));
          },
        },
      },
    });
    expect(extended.Users.findMany({ where: { id: 1 } })).toEqual([
      { id: 1, name: "Alice", age: 20, extra: true },
    ]);
  });

  test("query を呼ばないフックは実操作を実行しない", () => {
    const client = buildTestClient();
    const extended = client.$extends({
      query: {
        Users: {
          deleteMany() {
            return { count: 0 };
          },
        },
      },
    });
    expect(extended.Users.deleteMany({ where: {} })).toEqual({ count: 0 });
    expect(sheetOf(client, "Users").count({})).toBe(3);
  });

  test("書き込み系（create）でも args 改変が反映される", () => {
    const client = buildTestClient();
    const extended = client.$extends({
      query: {
        Users: {
          create({ args, query }) {
            return query({ ...args, data: { ...args.data, age: 99 } });
          },
        },
      },
    });
    const created = extended.Users.create({
      data: { id: 4, name: "Dave", age: 1 },
    });
    expect(created).toEqual({ id: 4, name: "Dave", age: 99 });
    expect(sheetOf(client, "Users").count({})).toBe(4);
  });

  test("元クライアントは $extends の影響を受けない", () => {
    const client = buildTestClient();
    const calls: string[] = [];
    const extended = client.$extends({
      query: {
        $allModels: {
          $allOperations({ operation, args, query }) {
            calls.push(operation);
            return query(args);
          },
        },
      },
    });
    void extended;
    sheetOf(client, "Users").findMany({});
    sheetOf(client, "Users").count({});
    expect(calls).toEqual([]);
  });

  test("フック対象外の操作は素通しで動く", () => {
    const client = buildTestClient();
    const calls: string[] = [];
    const extended = client.$extends({
      query: {
        Users: {
          findMany({ args, query }) {
            calls.push("findMany");
            return query(args);
          },
        },
      },
    });
    expect(extended.Users.count({})).toBe(3);
    expect(calls).toEqual([]);
  });

  test("query 未指定の拡張はパススルー", () => {
    const client = buildTestClient();
    const extended = client.$extends({});
    expect(extended.Users.findMany({})).toEqual(
      sheetOf(client, "Users").findMany({}),
    );
  });

  test("操作以外のメンバー（getColumnHeaders / fields）は透過する", () => {
    const client = buildTestClient();
    const extended = client.$extends({
      query: {
        $allModels: {
          $allOperations({ args, query }) {
            return query(args);
          },
        },
      },
    });
    expect(extended.Users.getColumnHeaders()).toEqual(["id", "name", "age"]);
    const ref = extended.Users.fields.age;
    expect(ref.modelName).toBe("Users");
    expect(ref.name).toBe("age");
    expect(typeof extended.Users.changeSettings).toBe("function");
  });
});
