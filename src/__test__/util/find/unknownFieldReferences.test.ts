import {
  GassmaInvalidValueError,
  GassmaUnknownArgumentError,
} from "../../../errors/argument/argumentError";
import { buildTestClient, sheetOf } from "../extends/extendsTestClient";
import {
  buildTxTestEnv,
  clearGasGlobals,
} from "../transaction/transactionTestClient";

afterEach(() => {
  clearGasGlobals();
});

const looseUsers = (options?: {
  relations?: boolean;
}): { loose: any; typed: ReturnType<typeof sheetOf> } => {
  const typed = sheetOf(buildTestClient(options), "Users");
  const loose: any = typed;
  return { loose, typed };
};

const loosePosts = (): { loose: any; typed: ReturnType<typeof sheetOf> } => {
  const typed = sheetOf(buildTestClient({ relations: true }), "Posts");
  const loose: any = typed;
  return { loose, typed };
};

describe("distinct: 存在しない列名", () => {
  test("findMany: typo した列名はエラー(1行に潰れない)", () => {
    const { loose } = looseUsers();
    const fn = () => loose.findMany({ distinct: ["aeg"] });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow("Unknown argument `aeg`. Did you mean `age`?");
  });

  test("findMany: 文字列指定の typo もエラー", () => {
    const { loose } = looseUsers();
    const fn = () => loose.findMany({ distinct: "aeg" });
    expect(fn).toThrow(GassmaUnknownArgumentError);
  });

  test("findFirst: typo した列名はエラー", () => {
    const { loose } = looseUsers();
    const fn = () => loose.findFirst({ distinct: ["nmae"] });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow("Unknown argument `nmae`. Did you mean `name`?");
  });

  test("正しい列と typo が混在してもエラー", () => {
    const { loose } = looseUsers();
    const fn = () => loose.findMany({ distinct: ["name", "aeg"] });
    expect(fn).toThrow(GassmaUnknownArgumentError);
  });

  test("relation orderBy と併用した distinct の typo もエラー", () => {
    const { loose } = loosePosts();
    const fn = () =>
      loose.findMany({
        orderBy: { author: { name: "asc" } },
        distinct: ["titel"],
      });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow("Unknown argument `titel`. Did you mean `title`?");
  });

  test("relation orderBy つき findFirst の distinct の typo もエラー", () => {
    const { loose } = loosePosts();
    const fn = () =>
      loose.findFirst({
        orderBy: { author: { name: "asc" } },
        distinct: ["titel"],
      });
    expect(fn).toThrow(GassmaUnknownArgumentError);
  });

  test("正しい distinct は従来どおり動く", () => {
    const { typed } = looseUsers();
    expect(typed.findMany({ distinct: ["name"] })).toHaveLength(3);
  });
});

describe("cursor: 存在しない列名", () => {
  test("findMany: typo した列名はエラー(0行にならない)", () => {
    const { loose } = looseUsers();
    const fn = () => loose.findMany({ cursor: { di: 2 } });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow("Unknown argument `di`.\n\nAvailable: id, name, age");
  });

  test("findFirst: typo した列名はエラー", () => {
    const { loose } = looseUsers();
    const fn = () => loose.findFirst({ cursor: { di: 2 } });
    expect(fn).toThrow(GassmaUnknownArgumentError);
  });

  test("count: typo した列名はエラー", () => {
    const { loose } = looseUsers();
    const fn = () => loose.count({ cursor: { di: 2 } });
    expect(fn).toThrow(GassmaUnknownArgumentError);
  });

  test("relation orderBy と併用した cursor の typo もエラー", () => {
    const { loose } = loosePosts();
    const fn = () =>
      loose.findMany({
        orderBy: { author: { name: "asc" } },
        cursor: { di: 101 },
      });
    expect(fn).toThrow(GassmaUnknownArgumentError);
  });

  test("正しい cursor は従来どおり動く", () => {
    const { typed } = looseUsers();
    expect(typed.findMany({ cursor: { id: 2 } })).toEqual([
      { id: 2, name: "Bob", age: 30 },
      { id: 3, name: "Carol", age: 40 },
    ]);
  });

  test("存在する列で値が一致しない場合は従来どおり0行", () => {
    const { typed } = looseUsers();
    expect(typed.findMany({ cursor: { id: 99 } })).toEqual([]);
  });
});

describe("orderBy: 存在しない列名・リレーション名", () => {
  test("列名の typo (方向指定) はエラー", () => {
    const { loose } = looseUsers();
    const fn = () => loose.findMany({ orderBy: { aeg: "desc" } });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow("Unknown argument `aeg`. Did you mean `age`?");
  });

  test("列名の typo (sort/nulls 形式) はエラー", () => {
    const { loose } = looseUsers();
    const fn = () =>
      loose.findMany({ orderBy: { aeg: { sort: "desc", nulls: "first" } } });
    expect(fn).toThrow(GassmaUnknownArgumentError);
  });

  test("リレーション未定義シートで dict 値の未知キーは TypeError でなくエラー", () => {
    const { loose } = looseUsers();
    const fn = () => loose.findMany({ orderBy: { nmae: { name: "asc" } } });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow("Unknown argument `nmae`. Did you mean `name`?");
  });

  test("リレーション定義済みシートで未知キーの dict 値は TypeError でなくエラー", () => {
    const { loose } = loosePosts();
    const fn = () => loose.findMany({ orderBy: { athor: { name: "asc" } } });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow("Unknown argument `athor`. Did you mean `author`?");
  });

  test("findFirst でも未知キーの dict 値はエラー", () => {
    const { loose } = looseUsers();
    const fn = () => loose.findFirst({ orderBy: { nmae: { name: "asc" } } });
    expect(fn).toThrow(GassmaUnknownArgumentError);
  });

  test("複数キーの orderBy でも各キーが検証される", () => {
    const { loose } = looseUsers();
    const fn = () =>
      loose.findMany({ orderBy: [{ name: "asc" }, { aeg: "desc" }] });
    expect(fn).toThrow(GassmaUnknownArgumentError);
  });

  test("リレーション名に方向を直接指定するとエラー", () => {
    const { loose } = loosePosts();
    const fn = () => loose.findMany({ orderBy: { author: "asc" } });
    expect(fn).toThrow(GassmaInvalidValueError);
  });

  test("正しいリレーション orderBy は従来どおり動く", () => {
    const { typed } = loosePosts();
    expect(typed.findMany({ orderBy: { author: { name: "desc" } } })).toEqual([
      { id: 102, authorId: 2, title: "Post B" },
      { id: 101, authorId: 1, title: "Post A" },
    ]);
  });

  test("正しい sort/nulls 形式は従来どおり動く", () => {
    const { typed } = looseUsers();
    expect(
      typed.findMany({ orderBy: { age: { sort: "desc", nulls: "first" } } }),
    ).toEqual([
      { id: 3, name: "Carol", age: 40 },
      { id: 2, name: "Bob", age: 30 },
      { id: 1, name: "Alice", age: 20 },
    ]);
  });

  test("スカラーとリレーション混在の orderBy は従来どおり動く", () => {
    const { typed } = loosePosts();
    expect(
      typed.findMany({
        orderBy: [{ title: "asc" }, { author: { name: "desc" } }],
      }),
    ).toEqual([
      { id: 101, authorId: 1, title: "Post A" },
      { id: 102, authorId: 2, title: "Post B" },
    ]);
  });

  test("$transaction 内でも orderBy の typo はエラー", () => {
    const env = buildTxTestEnv();
    const tx = (env.client as any).$transaction.bind(env.client);
    expect(() =>
      tx((txClient: any) =>
        txClient.Users.findMany({ orderBy: { aeg: "desc" } }),
      ),
    ).toThrow(GassmaUnknownArgumentError);
  });

  test("$extends の算出フィールドは orderBy に使えない", () => {
    const client = buildTestClient();
    const extended = client.$extends({
      result: {
        Users: {
          upperName: {
            needs: { name: true },
            compute: (user: { name: string }) => user.name.toUpperCase(),
          },
        },
      },
    });
    const loose: any = extended.Users;
    expect(() => loose.findMany({ orderBy: { upperName: "asc" } })).toThrow(
      GassmaUnknownArgumentError,
    );
  });

  test("$extends の算出フィールドは distinct に使えない", () => {
    const client = buildTestClient();
    const extended = client.$extends({
      result: {
        Users: {
          upperName: {
            needs: { name: true },
            compute: (user: { name: string }) => user.name.toUpperCase(),
          },
        },
      },
    });
    const loose: any = extended.Users;
    expect(() => loose.findMany({ distinct: ["upperName"] })).toThrow(
      GassmaUnknownArgumentError,
    );
  });

  test("_count の relation orderBy は従来どおり動く", () => {
    const { typed } = loosePosts();
    expect(
      typed.findMany({ orderBy: { comments: { _count: "asc" } } }),
    ).toEqual([
      { id: 102, authorId: 2, title: "Post B" },
      { id: 101, authorId: 1, title: "Post A" },
    ]);
  });
});
