import {
  GassmaInvalidValueError,
  GassmaUnknownArgumentError,
} from "../../errors/argument/argumentError";
import { raw } from "../../util/raw/raw";
import { buildTestClient, sheetOf } from "./extends/extendsTestClient";
import {
  buildTxTestEnv,
  clearGasGlobals,
} from "./transaction/transactionTestClient";

afterEach(() => {
  clearGasGlobals();
});

const NUMBER_OPS = "increment, decrement, multiply, divide";

const looseUsers = (options?: {
  relations?: boolean;
}): { loose: any; typed: ReturnType<typeof sheetOf> } => {
  const typed = sheetOf(buildTestClient(options), "Users");
  const loose: any = typed;
  return { loose, typed };
};

const expectAliceIntact = (typed: ReturnType<typeof sheetOf>) => {
  const alice = typed.findFirst({ where: { id: 1 } }) as Record<
    string,
    unknown
  >;
  expect(alice).toEqual({ id: 1, name: "Alice", age: 20 });
  expect(typeof alice.age).toBe("number");
};

describe("数値演算子の typo", () => {
  test("update: incrment はエラーになりセルの実体が変化しない", () => {
    const env = buildTxTestEnv();
    const loose: any = sheetOf(env.client, "Users");
    const before = env.users.snapshot();
    const fn = () =>
      loose.update({ where: { id: 1 }, data: { age: { incrment: 1 } } });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow(
      `Unknown argument \`incrment\`. Did you mean \`increment\`?\n\nAvailable: ${NUMBER_OPS}`,
    );
    expect(env.users.snapshot()).toEqual(before);
  });

  test("update: 正しい increment は従来どおり加算される", () => {
    const { typed } = looseUsers();
    const result = typed.update({
      where: { id: 1 },
      data: { age: { increment: 1 } },
    }) as Record<string, unknown>;
    expect(result.age).toBe(21);
  });

  test("updateMany: dcrement はエラーになり行が変化しない", () => {
    const { loose, typed } = looseUsers();
    const fn = () =>
      loose.updateMany({ where: {}, data: { age: { dcrement: 1 } } });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow(
      "Unknown argument `dcrement`. Did you mean `decrement`?",
    );
    expectAliceIntact(typed);
  });

  test("updateManyAndReturn: multiplyy はエラー", () => {
    const { loose, typed } = looseUsers();
    const fn = () =>
      loose.updateManyAndReturn({ where: {}, data: { age: { multiplyy: 2 } } });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow(
      "Unknown argument `multiplyy`. Did you mean `multiply`?",
    );
    expectAliceIntact(typed);
  });

  test("upsert(update 側): incrment はエラーになり行が変化しない", () => {
    const { loose, typed } = looseUsers();
    const fn = () =>
      loose.upsert({
        where: { id: 1 },
        create: { id: 1, name: "Alice", age: 20 },
        update: { age: { incrment: 1 } },
      });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expectAliceIntact(typed);
  });

  test("有効キーと未知キーが混在してもエラー", () => {
    const { loose, typed } = looseUsers();
    const fn = () =>
      loose.update({
        where: { id: 1 },
        data: { age: { increment: 1, foo: 2 } },
      });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow(`Unknown argument \`foo\`.\n\nAvailable: ${NUMBER_OPS}`);
    expectAliceIntact(typed);
  });

  test("Date の値は素通しされる", () => {
    const { typed } = looseUsers();
    const date = new Date("2026-01-02T03:04:05Z");
    const result = typed.update({
      where: { id: 1 },
      data: { name: date },
    }) as Record<string, unknown>;
    expect(result.name).toEqual(date);
  });

  test("Gassma.raw の値は素通しされる", () => {
    const { typed } = looseUsers();
    const result = typed.update({
      where: { id: 1 },
      data: { name: raw("=SUM(1,2)") },
    }) as Record<string, unknown>;
    expect(result.name).toBe("=SUM(1,2)");
  });

  test("演算子でない普通のオブジェクト値もエラーになり書き込まれない", () => {
    const { loose, typed } = looseUsers();
    const fn = () =>
      loose.update({ where: { id: 1 }, data: { name: { foo: "bar" } } });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow(`Unknown argument \`foo\`.\n\nAvailable: ${NUMBER_OPS}`);
    expectAliceIntact(typed);
  });
});

describe("nested write の操作キー typo", () => {
  const buildRelClient = () => {
    const client = buildTestClient({ relations: true });
    return {
      users: sheetOf(client, "Users"),
      posts: sheetOf(client, "Posts"),
      looseUsers: sheetOf(client, "Users") as any,
    };
  };

  test("create: crate はエラーになり親も子も作られない", () => {
    const { users, posts, looseUsers } = buildRelClient();
    const fn = () =>
      looseUsers.create({
        data: {
          id: 4,
          name: "Dave",
          age: 50,
          posts: { crate: [{ id: 103, title: "New Post" }] },
        },
      });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow(
      "Unknown argument `crate`. Did you mean `create`?\n\nAvailable: create, createMany, connect, connectOrCreate",
    );
    expect(users.count({})).toBe(3);
    expect(posts.count({})).toBe(2);
  });

  test("create: connct はエラー", () => {
    const { looseUsers, users } = buildRelClient();
    const fn = () =>
      looseUsers.create({
        data: { id: 4, name: "Dave", age: 50, posts: { connct: { id: 101 } } },
      });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow("Unknown argument `connct`. Did you mean `connect`?");
    expect(users.count({})).toBe(3);
  });

  test("create: update 専用の set は create では許されない", () => {
    const { looseUsers, users } = buildRelClient();
    const fn = () =>
      looseUsers.create({
        data: { id: 4, name: "Dave", age: 50, posts: { set: [] } },
      });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow(
      "Unknown argument `set`.\n\nAvailable: create, createMany, connect, connectOrCreate",
    );
    expect(users.count({})).toBe(3);
  });

  test("update: disconect はエラーになり行が変化しない", () => {
    const { looseUsers, users } = buildRelClient();
    const fn = () =>
      looseUsers.update({
        where: { id: 1 },
        data: { posts: { disconect: true } },
      });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow(
      "Unknown argument `disconect`. Did you mean `disconnect`?\n\nAvailable: create, createMany, connect, connectOrCreate, update, delete, deleteMany, disconnect, set",
    );
    expectAliceIntact(users);
  });

  test("update: st は set をサジェストする", () => {
    const { looseUsers } = buildRelClient();
    const fn = () =>
      looseUsers.update({ where: { id: 1 }, data: { posts: { st: [] } } });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow("Unknown argument `st`. Did you mean `set`?");
  });

  test("update: 正しい set は従来どおり動く", () => {
    const { users, posts } = buildRelClient();
    const looseU: any = users;
    looseU.update({ where: { id: 1 }, data: { posts: { set: [] } } });
    expect(posts.count({ where: { authorId: 1 } })).toBe(0);
  });

  test("connectOrCreate の内側キー creat はエラー", () => {
    const { looseUsers, posts } = buildRelClient();
    const fn = () =>
      looseUsers.create({
        data: {
          id: 4,
          name: "Dave",
          age: 50,
          posts: {
            connectOrCreate: {
              where: { id: 103 },
              creat: { id: 103, title: "New Post" },
            },
          },
        },
      });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow(
      "Unknown argument `creat`. Did you mean `create`?\n\nAvailable: where, create",
    );
    expect(posts.count({})).toBe(2);
  });

  test("connectOrCreate の内側キー wher(配列形式・update 経由)もエラー", () => {
    const { looseUsers } = buildRelClient();
    const fn = () =>
      looseUsers.update({
        where: { id: 1 },
        data: {
          posts: {
            connectOrCreate: [
              { wher: { id: 103 }, create: { id: 103, title: "New Post" } },
            ],
          },
        },
      });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow("Unknown argument `wher`. Did you mean `where`?");
  });

  test("正しい nested create は従来どおり動く", () => {
    const { users, posts } = buildRelClient();
    const looseU: any = users;
    looseU.create({
      data: {
        id: 4,
        name: "Dave",
        age: 50,
        posts: { create: [{ id: 103, title: "New Post" }] },
      },
    });
    expect(users.count({})).toBe(4);
    expect(posts.count({ where: { authorId: 4 } })).toBe(1);
  });
});

describe("orderBy の方向 typo", () => {
  test('findMany: "DESC" はエラーになる', () => {
    const { loose } = looseUsers();
    const fn = () => loose.findMany({ orderBy: { age: "DESC" } });
    expect(fn).toThrow(GassmaInvalidValueError);
    expect(fn).toThrow(
      'Invalid value for argument `orderBy`. Expected "asc" | "desc".',
    );
  });

  test('findFirst: "DESC" はエラーになる(黙って最小を返さない)', () => {
    const { loose } = looseUsers();
    const fn = () => loose.findFirst({ orderBy: { age: "DESC" } });
    expect(fn).toThrow(GassmaInvalidValueError);
  });

  test("findMany: 配列形式の 2 本目でもエラー", () => {
    const { loose } = looseUsers();
    const fn = () =>
      loose.findMany({ orderBy: [{ age: "desc" }, { name: "ASC" }] });
    expect(fn).toThrow(GassmaInvalidValueError);
  });

  test('sort の値 "DESC" はエラー', () => {
    const { loose } = looseUsers();
    const fn = () => loose.findMany({ orderBy: { age: { sort: "DESC" } } });
    expect(fn).toThrow(GassmaInvalidValueError);
    expect(fn).toThrow(
      'Invalid value for argument `sort`. Expected "asc" | "desc".',
    );
  });

  test('nulls の値 "frist" はエラー', () => {
    const { loose } = looseUsers();
    const fn = () =>
      loose.findMany({ orderBy: { age: { sort: "desc", nulls: "frist" } } });
    expect(fn).toThrow(GassmaInvalidValueError);
    expect(fn).toThrow(
      'Invalid value for argument `nulls`. Expected "first" | "last".',
    );
  });

  test("srot(sort の typo)はサジェスト付きエラー", () => {
    const { loose } = looseUsers();
    const fn = () => loose.findMany({ orderBy: { age: { srot: "desc" } } });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow(
      "Unknown argument `srot`. Did you mean `sort`?\n\nAvailable: sort, nulls",
    );
  });

  test("srot はリレーションありのシートでも同じエラー(生 TypeError にしない)", () => {
    const { loose } = looseUsers({ relations: true });
    const fn = () => loose.findMany({ orderBy: { age: { srot: "desc" } } });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow("Unknown argument `srot`. Did you mean `sort`?");
  });

  test("sort と nuls(nulls の typo)の同居もエラー", () => {
    const { loose } = looseUsers();
    const fn = () =>
      loose.findMany({ orderBy: { age: { sort: "desc", nuls: "first" } } });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow("Unknown argument `nuls`. Did you mean `nulls`?");
  });

  test('リレーション orderBy の方向 "DESC" もエラー', () => {
    const { loose } = looseUsers({ relations: true });
    const fn = () => loose.findMany({ orderBy: { posts: { _count: "DESC" } } });
    expect(fn).toThrow(GassmaInvalidValueError);
  });

  test("正しい orderBy は従来どおり動く", () => {
    const { typed } = looseUsers();
    const desc = typed.findMany({ orderBy: { age: "desc" } }) as Record<
      string,
      unknown
    >[];
    expect(desc.map((r) => r.age)).toEqual([40, 30, 20]);
    const withInput = typed.findMany({
      orderBy: { age: { sort: "desc", nulls: "last" } },
    }) as Record<string, unknown>[];
    expect(withInput.map((r) => r.age)).toEqual([40, 30, 20]);
  });

  test("リレーション orderBy(正しい値)は従来どおり動く", () => {
    const { typed } = looseUsers({ relations: true });
    const result = typed.findMany({
      orderBy: { posts: { _count: "desc" } },
    }) as Record<string, unknown>[];
    expect(result).toHaveLength(3);
  });
});

describe("$transaction / $extends 経由", () => {
  test("tx 内の update({age:{incrment}}) もエラーになりセルが変化しない", () => {
    const env = buildTxTestEnv();
    const tx = (env.client as any).$transaction.bind(env.client);
    const before = env.users.snapshot();
    expect(() =>
      tx((txClient: any) => {
        txClient.Users.update({
          where: { id: 1 },
          data: { age: { incrment: 1 } },
        });
      }),
    ).toThrow(GassmaUnknownArgumentError);
    expect(env.users.snapshot()).toEqual(before);
  });

  test("$extends の query フックを素通しした typo もエラー", () => {
    const client = buildTestClient();
    const extended = client.$extends({
      query: {
        Users: {
          update({ args, query }) {
            return query(args);
          },
        },
      },
    });
    const loose: any = extended.Users;
    expect(() =>
      loose.update({ where: { id: 1 }, data: { age: { incrment: 1 } } }),
    ).toThrow(GassmaUnknownArgumentError);
    expect(extended.Users.findFirst({ where: { id: 1 } })).toEqual({
      id: 1,
      name: "Alice",
      age: 20,
    });
  });
});
