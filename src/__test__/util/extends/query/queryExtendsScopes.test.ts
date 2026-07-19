import type { QueryHookParams } from "../../../../types/extendsTypes";
import { buildTestClient, clearSpreadsheetApp } from "../extendsTestClient";

afterAll(clearSpreadsheetApp);

const tap =
  (label: string, log: string[]) =>
  ({ args, query }: QueryHookParams) => {
    log.push(`${label}:in`);
    const result = query(args);
    log.push(`${label}:out`);
    return result;
  };

describe("$extends query: スコープと合成順", () => {
  test("モデル別 $allOperations は対象モデルの全操作で発火する", () => {
    const client = buildTestClient();
    const ops: string[] = [];
    const extended = client.$extends({
      query: {
        Users: {
          $allOperations({ model, operation, args, query }) {
            ops.push(`${model}.${operation}`);
            return query(args);
          },
        },
      },
    });
    extended.Users.findMany({});
    extended.Users.count({});
    extended.Posts.findMany({});
    expect(ops).toEqual(["Users.findMany", "Users.count"]);
  });

  test("$allModels の操作別フックは全モデルで発火する", () => {
    const client = buildTestClient();
    const models: string[] = [];
    const extended = client.$extends({
      query: {
        $allModels: {
          findMany({ model, args, query }) {
            models.push(model);
            return query(args);
          },
        },
      },
    });
    extended.Users.findMany({});
    extended.Posts.findMany({});
    extended.Users.count({});
    expect(models).toEqual(["Users", "Posts"]);
  });

  test("1拡張内の合成順は モデル別×操作別 → モデル別×$allOperations → $allModels×操作別 → $allModels×$allOperations（外→内）", () => {
    const client = buildTestClient();
    const log: string[] = [];
    const extended = client.$extends({
      query: {
        Users: {
          findMany: tap("model.op", log),
          $allOperations: tap("model.all", log),
        },
        $allModels: {
          findMany: tap("allModels.op", log),
          $allOperations: tap("allModels.all", log),
        },
      },
    });
    extended.Users.findMany({});
    expect(log).toEqual([
      "model.op:in",
      "model.all:in",
      "allModels.op:in",
      "allModels.all:in",
      "allModels.all:out",
      "allModels.op:out",
      "model.all:out",
      "model.op:out",
    ]);

    log.length = 0;
    extended.Posts.findMany({});
    expect(log).toEqual([
      "allModels.op:in",
      "allModels.all:in",
      "allModels.all:out",
      "allModels.op:out",
    ]);
  });

  test("全15操作が $allOperations を通り operation 名が渡る", () => {
    const client = buildTestClient();
    const ops: string[] = [];
    const extended = client.$extends({
      query: {
        $allModels: {
          $allOperations({ operation, args, query }) {
            ops.push(operation);
            return query(args);
          },
        },
      },
    });
    const users = extended.Users;
    users.findFirst({ where: { id: 1 } });
    users.findFirstOrThrow({ where: { id: 1 } });
    users.findMany({});
    users.count({});
    users.aggregate({ _count: { id: true } });
    users.groupBy({ by: "age", _count: { id: true } });
    users.create({ data: { id: 10, name: "X", age: 1 } });
    users.createMany({ data: [{ id: 11, name: "Y", age: 2 }] });
    users.createManyAndReturn({ data: [{ id: 12, name: "Z", age: 3 }] });
    users.update({ where: { id: 10 }, data: { age: 5 } });
    users.updateMany({ where: { id: 11 }, data: { age: 6 } });
    users.updateManyAndReturn({ where: { id: 12 }, data: { age: 7 } });
    users.upsert({
      where: { id: 13 },
      create: { id: 13, name: "U", age: 8 },
      update: { age: 9 },
    });
    users.delete({ where: { id: 13 } });
    users.deleteMany({ where: { id: 12 } });
    expect(ops).toEqual([
      "findFirst",
      "findFirstOrThrow",
      "findMany",
      "count",
      "aggregate",
      "groupBy",
      "create",
      "createMany",
      "createManyAndReturn",
      "update",
      "updateMany",
      "updateManyAndReturn",
      "upsert",
      "delete",
      "deleteMany",
    ]);
  });

  test("include の内部リレーション解決はフックを通らない", () => {
    const client = buildTestClient({ relations: true });
    const ops: string[] = [];
    const extended = client.$extends({
      query: {
        $allModels: {
          $allOperations({ model, operation, args, query }) {
            ops.push(`${model}.${operation}`);
            return query(args);
          },
        },
      },
    });
    const result = extended.Users.findMany({
      where: { id: 1 },
      include: { posts: true },
    });
    expect(result).toEqual([
      {
        id: 1,
        name: "Alice",
        age: 20,
        posts: [{ id: 101, authorId: 1, title: "Post A" }],
      },
    ]);
    expect(ops).toEqual(["Users.findMany"]);
  });
});
