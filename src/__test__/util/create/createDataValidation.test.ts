import {
  GassmaInvalidValueError,
  GassmaUnknownArgumentError,
} from "../../../errors/argument/argumentError";
import { GassmaClient } from "../../../gassma";
import { GassmaController } from "../../../gassmaController";
import { raw } from "../../../util/raw/raw";
import {
  clearGasGlobals,
  makeLoggedSheet,
} from "../transaction/transactionTestClient";

type EnvOptions = {
  relations?: boolean;
  ignore?: { [sheetName: string]: string };
};

const buildEnv = (options?: EnvOptions) => {
  const users = makeLoggedSheet("Users", [
    ["id", "name", "age"],
    [1, "Alice", 20],
    [2, "Bob", 30],
  ]);
  const posts = makeLoggedSheet("Posts", [
    ["id", "authorId", "title"],
    [101, 1, "Post A"],
  ]);
  const comments = makeLoggedSheet("Comments", [
    ["id", "postId", "body"],
    [1001, 101, "Hello"],
  ]);
  const sheets = [users.sheet, posts.sheet, comments.sheet];
  const spreadsheet: any = {
    getId: () => "create-data-validation-test",
    getSheets: () => sheets,
    getSheetByName: (name: string) =>
      sheets.find((sheet: any) => sheet.getName() === name) ?? null,
  };
  Object.assign(globalThis, {
    SpreadsheetApp: { getActiveSpreadsheet: () => spreadsheet },
  });
  const relations = options?.relations
    ? {
        Posts: {
          comments: {
            type: "oneToMany" as const,
            to: "Comments",
            field: "id",
            reference: "postId",
          },
        },
        Comments: {
          post: {
            type: "manyToOne" as const,
            to: "Posts",
            field: "postId",
            reference: "id",
          },
        },
      }
    : undefined;
  const client = new GassmaClient({
    ...(relations ? { relations } : {}),
    ...(options?.ignore ? { ignore: options.ignore } : {}),
  });
  return { client, users, posts, comments };
};

const sheetOf = (client: GassmaClient, name: string): GassmaController => {
  const record = Object.assign<Record<string, unknown>, GassmaClient>(
    {},
    client,
  );
  const controller = record[name];
  if (!(controller instanceof GassmaController)) {
    throw new Error(`controller not found: ${name}`);
  }
  return controller;
};

afterEach(() => {
  clearGasGlobals();
});

describe("create: 列名キーへの素の dict 値はエラー", () => {
  test("create: age に set はエラーになりセルにオブジェクトが書かれない", () => {
    const env = buildEnv();
    const before = env.users.snapshot();
    const loose: any = sheetOf(env.client, "Users");
    const fn = () =>
      loose.create({ data: { id: 8, name: "S", age: { set: 5 } } });
    expect(fn).toThrow(GassmaInvalidValueError);
    expect(fn).toThrow("Invalid value for argument `age`.");
    expect(env.users.snapshot()).toEqual(before);
  });

  test("create: age に increment はエラーになり行が追加されない", () => {
    const env = buildEnv();
    const before = env.users.snapshot();
    const loose: any = sheetOf(env.client, "Users");
    expect(() =>
      loose.create({ data: { id: 7, name: "I", age: { increment: 1 } } }),
    ).toThrow(GassmaInvalidValueError);
    expect(env.users.snapshot()).toEqual(before);
  });

  test("createMany: 2行目の dict 値もエラーになり1行も追加されない", () => {
    const env = buildEnv();
    const before = env.users.snapshot();
    const loose: any = sheetOf(env.client, "Users");
    expect(() =>
      loose.createMany({
        data: [
          { id: 8, name: "S", age: 1 },
          { id: 9, name: "T", age: { set: 5 } },
        ],
      }),
    ).toThrow(GassmaInvalidValueError);
    expect(env.users.snapshot()).toEqual(before);
  });

  test("createManyAndReturn: dict 値はエラーになり追加されない", () => {
    const env = buildEnv();
    const before = env.users.snapshot();
    const loose: any = sheetOf(env.client, "Users");
    expect(() =>
      loose.createManyAndReturn({
        data: [{ id: 8, name: "S", age: { increment: 1 } }],
      }),
    ).toThrow(GassmaInvalidValueError);
    expect(env.users.snapshot()).toEqual(before);
  });

  test("upsert(作成分岐): create 側の dict 値はエラーになり追加されない", () => {
    const env = buildEnv();
    const before = env.users.snapshot();
    const loose: any = sheetOf(env.client, "Users");
    expect(() =>
      loose.upsert({
        where: { id: 99 },
        create: { id: 99, name: "Z", age: { set: 5 } },
        update: { name: "Z" },
      }),
    ).toThrow(GassmaInvalidValueError);
    expect(env.users.snapshot()).toEqual(before);
  });

  test("Date 値は従来どおり書き込める", () => {
    const env = buildEnv();
    const typed = sheetOf(env.client, "Users");
    const birthday = new Date(2024, 0, 1);
    const loose: any = typed;
    expect(() =>
      loose.create({ data: { id: 8, name: birthday, age: 1 } }),
    ).not.toThrow();
    expect(typed.count({})).toBe(3);
  });

  test("Gassma.raw は従来どおり書き込める", () => {
    const env = buildEnv();
    const typed = sheetOf(env.client, "Users");
    const loose: any = typed;
    expect(() =>
      loose.create({ data: { id: 8, name: raw("=1+1"), age: 1 } }),
    ).not.toThrow();
    expect(typed.count({})).toBe(3);
  });

  test("配列値は従来どおり素通しされる", () => {
    const env = buildEnv();
    const typed = sheetOf(env.client, "Users");
    const loose: any = typed;
    expect(() =>
      loose.create({ data: { id: 8, name: "A", age: [1, 2] } }),
    ).not.toThrow();
    expect(typed.count({})).toBe(3);
  });
});

describe("nested create と typo の併用で部分書き込みしない", () => {
  test("create: 親の typo は関連レコード作成より先にエラーになる", () => {
    const env = buildEnv({ relations: true });
    const postsBefore = env.posts.snapshot();
    const commentsBefore = env.comments.snapshot();
    const loose: any = sheetOf(env.client, "Comments");
    expect(() =>
      loose.create({
        data: {
          id: 2000,
          bdy: "X",
          post: { create: { id: 300, title: "New" } },
        },
      }),
    ).toThrow(GassmaUnknownArgumentError);
    expect(env.posts.snapshot()).toEqual(postsBefore);
    expect(env.comments.snapshot()).toEqual(commentsBefore);
  });

  test("create: connectOrCreate 併用でも typo で関連側が作られない", () => {
    const env = buildEnv({ relations: true });
    const postsBefore = env.posts.snapshot();
    const loose: any = sheetOf(env.client, "Comments");
    expect(() =>
      loose.create({
        data: {
          id: 2000,
          bdy: "X",
          post: {
            connectOrCreate: {
              where: { id: 999 },
              create: { id: 300, title: "New" },
            },
          },
        },
      }),
    ).toThrow(GassmaUnknownArgumentError);
    expect(env.posts.snapshot()).toEqual(postsBefore);
  });

  test("upsert(作成分岐): typo で関連側が作られない", () => {
    const env = buildEnv({ relations: true });
    const postsBefore = env.posts.snapshot();
    const commentsBefore = env.comments.snapshot();
    const loose: any = sheetOf(env.client, "Comments");
    expect(() =>
      loose.upsert({
        where: { id: 9999 },
        create: {
          id: 2000,
          bdy: "X",
          post: { create: { id: 300, title: "New" } },
        },
        update: { body: "Y" },
      }),
    ).toThrow(GassmaUnknownArgumentError);
    expect(env.posts.snapshot()).toEqual(postsBefore);
    expect(env.comments.snapshot()).toEqual(commentsBefore);
  });

  test("正常な nested create(manyToOne の create)は従来どおり通る", () => {
    const env = buildEnv({ relations: true });
    const comments = sheetOf(env.client, "Comments");
    const posts = sheetOf(env.client, "Posts");
    const loose: any = comments;
    const result = loose.create({
      data: {
        id: 2000,
        body: "ok",
        post: { create: { id: 300, title: "New" } },
      },
    });
    expect(result).toEqual({ id: 2000, postId: 300, body: "ok" });
    expect(posts.findFirst({ where: { id: 300 } })).toEqual({
      id: 300,
      authorId: null,
      title: "New",
    });
  });
});

describe("@ignore 列への書き込みは create でもエラー", () => {
  test("create: @ignore 列はエラーになり黙って無視されない", () => {
    const env = buildEnv({ ignore: { Users: "age" } });
    const before = env.users.snapshot();
    const loose: any = sheetOf(env.client, "Users");
    const fn = () => loose.create({ data: { id: 8, name: "Z", age: 1 } });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow("Available: id, name");
    expect(env.users.snapshot()).toEqual(before);
  });

  test("createMany: @ignore 列はエラーになり1行も追加されない", () => {
    const env = buildEnv({ ignore: { Users: "age" } });
    const before = env.users.snapshot();
    const loose: any = sheetOf(env.client, "Users");
    expect(() =>
      loose.createMany({
        data: [
          { id: 8, name: "Y" },
          { id: 9, name: "Z", age: 1 },
        ],
      }),
    ).toThrow(GassmaUnknownArgumentError);
    expect(env.users.snapshot()).toEqual(before);
  });

  test("createManyAndReturn: @ignore 列はエラーになり追加されない", () => {
    const env = buildEnv({ ignore: { Users: "age" } });
    const before = env.users.snapshot();
    const loose: any = sheetOf(env.client, "Users");
    expect(() =>
      loose.createManyAndReturn({ data: [{ id: 8, name: "Z", age: 1 }] }),
    ).toThrow(GassmaUnknownArgumentError);
    expect(env.users.snapshot()).toEqual(before);
  });

  test("upsert(作成分岐): create 側の @ignore 列はエラー", () => {
    const env = buildEnv({ ignore: { Users: "age" } });
    const before = env.users.snapshot();
    const loose: any = sheetOf(env.client, "Users");
    expect(() =>
      loose.upsert({
        where: { id: 99 },
        create: { id: 99, name: "Z", age: 1 },
        update: { name: "Z" },
      }),
    ).toThrow(GassmaUnknownArgumentError);
    expect(env.users.snapshot()).toEqual(before);
  });

  test("upsert(更新分岐): update 側の @ignore 列はエラー", () => {
    const env = buildEnv({ ignore: { Users: "age" } });
    const before = env.users.snapshot();
    const loose: any = sheetOf(env.client, "Users");
    expect(() =>
      loose.upsert({
        where: { id: 1 },
        create: { id: 1, name: "Alice" },
        update: { age: 99 },
      }),
    ).toThrow(GassmaUnknownArgumentError);
    expect(env.users.snapshot()).toEqual(before);
  });

  test("@ignore 列を含まない create は従来どおり通る", () => {
    const env = buildEnv({ ignore: { Users: "age" } });
    const typed = sheetOf(env.client, "Users");
    const result = typed.create({ data: { id: 8, name: "Z" } });
    expect(result).toEqual({ id: 8, name: "Z" });
    expect(typed.count({})).toBe(3);
  });

  test("nested create の子データの @ignore 列もエラーになり両シート無変化", () => {
    const env = buildEnv({ relations: true, ignore: { Posts: "title" } });
    const postsBefore = env.posts.snapshot();
    const commentsBefore = env.comments.snapshot();
    const loose: any = sheetOf(env.client, "Comments");
    expect(() =>
      loose.create({
        data: {
          id: 2000,
          body: "x",
          post: { create: { id: 300, title: "T" } },
        },
      }),
    ).toThrow(GassmaUnknownArgumentError);
    expect(env.posts.snapshot()).toEqual(postsBefore);
    expect(env.comments.snapshot()).toEqual(commentsBefore);
  });
});
