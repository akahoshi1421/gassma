import { GassmaFindSelectOmitConflictError } from "../../../errors/find/findError";
import { GassmaIncludeSelectConflictError } from "../../../errors/relation/relationError";
import { IncludeWithoutRelationsError } from "../../../errors/relation/relationValidationError";
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
});

describe("updateManyAndReturn の select / omit / include", () => {
  test("select は指定列だけを返す", () => {
    const users = sheetOf(buildTestClient(), "Users");
    const result = users.updateManyAndReturn({
      where: {},
      data: { age: 99 },
      select: { id: true, name: true },
    });
    expect(result).toEqual([
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
      { id: 3, name: "Carol" },
    ]);
  });

  test("select を使ってもシートは更新される", () => {
    const users = sheetOf(buildTestClient(), "Users");
    users.updateManyAndReturn({
      where: { id: 1 },
      data: { age: 99 },
      select: { id: true },
    });
    expect(users.findFirst({ where: { id: 1 } })).toEqual({
      id: 1,
      name: "Alice",
      age: 99,
    });
  });

  test("omit は指定列を除いて返す", () => {
    const users = sheetOf(buildTestClient(), "Users");
    const result = users.updateManyAndReturn({
      where: {},
      data: { name: "X" },
      omit: { age: true },
    });
    expect(result).toEqual([
      { id: 1, name: "X" },
      { id: 2, name: "X" },
      { id: 3, name: "X" },
    ]);
  });

  test("include はリレーション先を付けて返す", () => {
    const posts = sheetOf(buildTestClient({ relations: true }), "Posts");
    const result = posts.updateManyAndReturn({
      where: { id: 101 },
      data: { title: "Edited" },
      include: { author: true },
    });
    expect(result).toEqual([
      {
        id: 101,
        authorId: 1,
        title: "Edited",
        author: { id: 1, name: "Alice", age: 20 },
      },
    ]);
  });

  test("include と omit は併用できる", () => {
    const posts = sheetOf(buildTestClient({ relations: true }), "Posts");
    const result = posts.updateManyAndReturn({
      where: { id: 101 },
      data: { title: "Edited" },
      include: { author: true },
      omit: { title: true },
    });
    expect(result).toEqual([
      {
        id: 101,
        authorId: 1,
        author: { id: 1, name: "Alice", age: 20 },
      },
    ]);
  });

  test("include と select の同時指定はエラー", () => {
    const posts = sheetOf(buildTestClient({ relations: true }), "Posts");
    expect(() =>
      posts.updateManyAndReturn({
        where: {},
        data: { title: "X" },
        include: { author: true },
        select: { id: true },
      }),
    ).toThrow(GassmaIncludeSelectConflictError);
  });

  test("select と omit の同時指定はエラー", () => {
    const users = sheetOf(buildTestClient(), "Users");
    expect(() =>
      users.updateManyAndReturn({
        where: {},
        data: { age: 1 },
        select: { id: true },
        omit: { name: true },
      }),
    ).toThrow(GassmaFindSelectOmitConflictError);
  });

  test("リレーション未設定のクライアントで include はエラー", () => {
    const users = sheetOf(buildTestClient(), "Users");
    expect(() =>
      users.updateManyAndReturn({
        where: {},
        data: { age: 1 },
        include: { posts: true },
      }),
    ).toThrow(IncludeWithoutRelationsError);
  });

  test("select 等を渡さない従来の形は全列を返す", () => {
    const users = sheetOf(buildTestClient(), "Users");
    const result = users.updateManyAndReturn({
      where: { id: 1 },
      data: { age: 21 },
    });
    expect(result).toEqual([{ id: 1, name: "Alice", age: 21 }]);
  });

  test("$transaction 経由でも select が効く", () => {
    const env = buildTxTestEnv();
    const tx = (env.client as any).$transaction.bind(env.client);
    const result = tx((txClient: any) =>
      txClient.Users.updateManyAndReturn({
        where: {},
        data: { age: 0 },
        select: { name: true },
      }),
    );
    expect(result).toEqual([{ name: "Alice" }, { name: "Bob" }]);
  });

  test("$extends の query フック経由でも omit が効く", () => {
    const client = buildTestClient();
    const extended = client.$extends({
      query: {
        Users: {
          updateManyAndReturn({ args, query }) {
            return query(args);
          },
        },
      },
    });
    const result = extended.Users.updateManyAndReturn({
      where: { id: 1 },
      data: { age: 21 },
      omit: { age: true },
    });
    expect(result).toEqual([{ id: 1, name: "Alice" }]);
  });
});
