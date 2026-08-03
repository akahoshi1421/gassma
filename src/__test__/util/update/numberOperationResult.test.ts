import { GassmaInvalidValueError } from "../../../errors/argument/argumentError";
import { buildTestClient, sheetOf } from "../extends/extendsTestClient";

const looseUsers = (options?: {
  relations?: boolean;
}): { loose: any; typed: ReturnType<typeof sheetOf> } => {
  const typed = sheetOf(buildTestClient(options), "Users");
  const loose: any = typed;
  return { loose, typed };
};

const aliceUnchanged = (typed: ReturnType<typeof sheetOf>) => {
  expect(typed.findFirst({ where: { id: 1 } })).toEqual({
    id: 1,
    name: "Alice",
    age: 20,
  });
};

describe("ゼロ除算の結果はセルに書かれない", () => {
  test("updateMany: divide: 0 は Infinity になるのでエラー", () => {
    const { loose, typed } = looseUsers();
    const fn = () =>
      loose.updateMany({ where: { id: 1 }, data: { age: { divide: 0 } } });
    expect(fn).toThrow(GassmaInvalidValueError);
    expect(fn).toThrow(
      "Invalid value for argument `age`. Expected a finite number, but received Infinity.",
    );
    aliceUnchanged(typed);
  });

  test("update: divide: 0 はエラーになり行が更新されない", () => {
    const { loose, typed } = looseUsers();
    expect(() =>
      loose.update({ where: { id: 1 }, data: { age: { divide: 0 } } }),
    ).toThrow(GassmaInvalidValueError);
    aliceUnchanged(typed);
  });

  test("updateManyAndReturn: divide: 0 はエラーになり行が更新されない", () => {
    const { loose, typed } = looseUsers();
    expect(() =>
      loose.updateManyAndReturn({
        where: { id: 1 },
        data: { age: { divide: 0 } },
      }),
    ).toThrow(GassmaInvalidValueError);
    aliceUnchanged(typed);
  });

  test("現在値が 0 のときの divide: 0 は NaN になるのでエラー", () => {
    const { loose, typed } = looseUsers();
    loose.update({ where: { id: 1 }, data: { age: 0 } });
    expect(() =>
      loose.update({ where: { id: 1 }, data: { age: { divide: 0 } } }),
    ).toThrow(
      "Invalid value for argument `age`. Expected a finite number, but received NaN.",
    );
    expect(typed.findFirst({ where: { id: 1 } })).toEqual({
      id: 1,
      name: "Alice",
      age: 0,
    });
  });

  test("divide: -0 は -Infinity になるのでエラー", () => {
    const { loose, typed } = looseUsers();
    expect(() =>
      loose.updateMany({ where: { id: 1 }, data: { age: { divide: -0 } } }),
    ).toThrow(
      "Invalid value for argument `age`. Expected a finite number, but received -Infinity.",
    );
    aliceUnchanged(typed);
  });

  test("数値でないセルへの divide: 0 は NaN になるのでエラー", () => {
    const { loose, typed } = looseUsers();
    expect(() =>
      loose.updateMany({ where: { id: 1 }, data: { name: { divide: 0 } } }),
    ).toThrow(
      "Invalid value for argument `name`. Expected a finite number, but received NaN.",
    );
    aliceUnchanged(typed);
  });
});

describe("桁あふれした演算結果もセルに書かれない", () => {
  test("multiply がオーバーフローするとエラー", () => {
    const { loose, typed } = looseUsers();
    expect(() =>
      loose.updateMany({
        where: { id: 1 },
        data: { age: { multiply: 1e308 } },
      }),
    ).toThrow(
      "Invalid value for argument `age`. Expected a finite number, but received Infinity.",
    );
    aliceUnchanged(typed);
  });

  test("increment がオーバーフローするとエラー", () => {
    const { loose, typed } = looseUsers();
    loose.update({ where: { id: 1 }, data: { age: 1e308 } });
    expect(() =>
      loose.update({ where: { id: 1 }, data: { age: { increment: 1e308 } } }),
    ).toThrow(
      "Invalid value for argument `age`. Expected a finite number, but received Infinity.",
    );
    expect(typed.findFirst({ where: { id: 1 } })).toEqual({
      id: 1,
      name: "Alice",
      age: 1e308,
    });
  });

  test("decrement がオーバーフローするとエラー", () => {
    const { loose, typed } = looseUsers();
    loose.update({ where: { id: 1 }, data: { age: -1e308 } });
    expect(() =>
      loose.update({ where: { id: 1 }, data: { age: { decrement: 1e308 } } }),
    ).toThrow(
      "Invalid value for argument `age`. Expected a finite number, but received -Infinity.",
    );
    expect(typed.findFirst({ where: { id: 1 } })).toEqual({
      id: 1,
      name: "Alice",
      age: -1e308,
    });
  });
});

describe("リレーションのある経路でも書かれない", () => {
  test("update: リレーション定義があっても divide: 0 はエラー", () => {
    const { loose, typed } = looseUsers({ relations: true });
    expect(() =>
      loose.update({ where: { id: 1 }, data: { age: { divide: 0 } } }),
    ).toThrow(GassmaInvalidValueError);
    aliceUnchanged(typed);
  });

  test("updateMany: リレーション定義があっても divide: 0 はエラー", () => {
    const { loose, typed } = looseUsers({ relations: true });
    expect(() =>
      loose.updateMany({ where: { id: 1 }, data: { age: { divide: 0 } } }),
    ).toThrow(GassmaInvalidValueError);
    aliceUnchanged(typed);
  });

  test("nested update を伴う divide: 0 は子も書き換えない", () => {
    const client = buildTestClient({ relations: true });
    const users: any = sheetOf(client, "Users");
    const posts = sheetOf(client, "Posts");
    expect(() =>
      users.update({
        where: { id: 1 },
        data: {
          age: { divide: 0 },
          posts: { update: { where: { id: 101 }, data: { title: "変更後" } } },
        },
      }),
    ).toThrow(GassmaInvalidValueError);
    expect(posts.findFirst({ where: { id: 101 } })).toEqual({
      id: 101,
      authorId: 1,
      title: "Post A",
    });
  });

  test("upsert(更新分岐): divide: 0 はエラーになり更新されない", () => {
    const { loose, typed } = looseUsers({ relations: true });
    expect(() =>
      loose.upsert({
        where: { id: 1 },
        create: { id: 1, name: "Alice", age: 20 },
        update: { age: { divide: 0 } },
      }),
    ).toThrow(GassmaInvalidValueError);
    aliceUnchanged(typed);
  });
});

describe("有限に収まる演算は従来どおり通る", () => {
  test("divide: 2 は通る", () => {
    const { loose, typed } = looseUsers();
    loose.updateMany({ where: { id: 1 }, data: { age: { divide: 2 } } });
    expect(typed.findFirst({ where: { id: 1 } })).toEqual({
      id: 1,
      name: "Alice",
      age: 10,
    });
  });

  test("数値でないセルへの increment は 0 起点で通る", () => {
    const { loose, typed } = looseUsers();
    loose.updateMany({ where: { id: 1 }, data: { name: { increment: 3 } } });
    expect(typed.findFirst({ where: { id: 1 } })).toEqual({
      id: 1,
      name: 3,
      age: 20,
    });
  });
});
