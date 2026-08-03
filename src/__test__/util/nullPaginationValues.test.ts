import { GassmaInvalidValueError } from "../../errors/argument/argumentError";
import { IncludeInvalidOptionTypeError } from "../../errors/relation/relationValidationError";
import { buildTestClient, sheetOf } from "./extends/extendsTestClient";
import { clearGasGlobals } from "./transaction/transactionTestClient";

afterEach(() => {
  clearGasGlobals();
});

const looseUsers = (options?: { relations?: boolean }): any => {
  const typed = sheetOf(buildTestClient(options), "Users");
  const loose: any = typed;
  return loose;
};

const loosePosts = (): any => {
  const typed = sheetOf(buildTestClient({ relations: true }), "Posts");
  const loose: any = typed;
  return loose;
};

describe("findMany の take/skip の null はエラー", () => {
  test("take: null はエラー", () => {
    const loose = looseUsers();
    const fn = () => loose.findMany({ take: null });
    expect(fn).toThrow(GassmaInvalidValueError);
    expect(fn).toThrow(
      "Invalid value for argument `take`. Expected a number, but received null.",
    );
  });

  test("skip: null はエラー", () => {
    const loose = looseUsers();
    const fn = () => loose.findMany({ skip: null });
    expect(fn).toThrow(GassmaInvalidValueError);
    expect(fn).toThrow(
      "Invalid value for argument `skip`. Expected a number, but received null.",
    );
  });

  test("リレーション orderBy 経路でも take: null はエラー", () => {
    const loose = loosePosts();
    expect(() =>
      loose.findMany({ orderBy: { author: { name: "asc" } }, take: null }),
    ).toThrow(
      "Invalid value for argument `take`. Expected a number, but received null.",
    );
  });

  test("リレーション orderBy 経路でも skip: null はエラー", () => {
    const loose = loosePosts();
    expect(() =>
      loose.findMany({ orderBy: { author: { name: "asc" } }, skip: null }),
    ).toThrow(GassmaInvalidValueError);
  });

  test("take: undefined は従来どおり無視して全件", () => {
    const loose = looseUsers();
    expect(loose.findMany({ take: undefined })).toHaveLength(3);
  });
});

describe("findFirst の take/skip の null はエラー", () => {
  test("skip: null はエラー", () => {
    const loose = looseUsers();
    expect(() => loose.findFirst({ skip: null })).toThrow(
      "Invalid value for argument `skip`. Expected a number, but received null.",
    );
  });

  test("take: null はエラー", () => {
    const loose = looseUsers();
    expect(() => loose.findFirst({ take: null })).toThrow(
      "Invalid value for argument `take`. Expected a number, but received null.",
    );
  });

  test("findFirstOrThrow の skip: null もエラー", () => {
    const loose = looseUsers();
    expect(() => loose.findFirstOrThrow({ skip: null })).toThrow(
      GassmaInvalidValueError,
    );
  });
});

describe("count の take/skip の null はエラー", () => {
  test("take: null はエラー", () => {
    const loose = looseUsers();
    expect(() => loose.count({ take: null })).toThrow(GassmaInvalidValueError);
  });

  test("skip: null はエラー", () => {
    const loose = looseUsers();
    expect(() => loose.count({ skip: null })).toThrow(
      "Invalid value for argument `skip`. Expected a number, but received null.",
    );
  });
});

describe("aggregate の take/skip の null はエラー", () => {
  test("take: null はエラー", () => {
    const loose = looseUsers();
    expect(() => loose.aggregate({ _max: { age: true }, take: null })).toThrow(
      "Invalid value for argument `take`. Expected a number, but received null.",
    );
  });

  test("skip: null はエラー", () => {
    const loose = looseUsers();
    expect(() => loose.aggregate({ _max: { age: true }, skip: null })).toThrow(
      GassmaInvalidValueError,
    );
  });
});

describe("groupBy の take/skip の null はエラー", () => {
  test("take: null はエラー", () => {
    const loose = looseUsers();
    expect(() =>
      loose.groupBy({ by: ["age"], _min: { age: true }, take: null }),
    ).toThrow(
      "Invalid value for argument `take`. Expected a number, but received null.",
    );
  });

  test("skip: null はエラー", () => {
    const loose = looseUsers();
    expect(() =>
      loose.groupBy({ by: ["age"], _min: { age: true }, skip: null }),
    ).toThrow(GassmaInvalidValueError);
  });
});

describe("updateMany 系の limit の null はエラー", () => {
  test("updateMany の limit: null はエラー(黙って全件更新しない)", () => {
    const loose = looseUsers();
    const fn = () =>
      loose.updateMany({ where: {}, data: { name: "x" }, limit: null });
    expect(fn).toThrow(GassmaInvalidValueError);
    expect(fn).toThrow(
      "Invalid value for argument `limit`. Expected a number, but received null.",
    );
  });

  test("updateManyAndReturn の limit: null はエラー", () => {
    const loose = looseUsers();
    expect(() =>
      loose.updateManyAndReturn({
        where: {},
        data: { name: "x" },
        limit: null,
      }),
    ).toThrow(GassmaInvalidValueError);
  });

  test("limit: null で更新は一切走らない", () => {
    const loose = looseUsers();
    expect(() =>
      loose.updateMany({ where: {}, data: { name: "x" }, limit: null }),
    ).toThrow();
    expect(loose.findMany({ where: { name: "x" } })).toHaveLength(0);
  });
});

describe("deleteMany の limit の null はエラー", () => {
  test("limit: null はエラー(黙って全件削除しない)", () => {
    const loose = looseUsers();
    const fn = () => loose.deleteMany({ where: {}, limit: null });
    expect(fn).toThrow(GassmaInvalidValueError);
    expect(fn).toThrow(
      "Invalid value for argument `limit`. Expected a number, but received null.",
    );
  });

  test("limit: null で削除は一切走らない", () => {
    const loose = looseUsers();
    expect(() => loose.deleteMany({ where: {}, limit: null })).toThrow();
    expect(loose.findMany()).toHaveLength(3);
  });
});

describe("include の take/skip の null はエラー", () => {
  test("take: null はエラー", () => {
    const loose = looseUsers({ relations: true });
    const fn = () => loose.findMany({ include: { posts: { take: null } } });
    expect(fn).toThrow(IncludeInvalidOptionTypeError);
    expect(fn).toThrow('Include "posts": option "take" must be a number');
  });

  test("skip: null はエラー", () => {
    const loose = looseUsers({ relations: true });
    expect(() =>
      loose.findMany({ include: { posts: { skip: null } } }),
    ).toThrow('Include "posts": option "skip" must be a number');
  });

  test("ネストした include の take: null もエラー", () => {
    const loose = looseUsers({ relations: true });
    expect(() =>
      loose.findMany({
        include: { posts: { include: { comments: { take: null } } } },
      }),
    ).toThrow('Include "comments": option "take" must be a number');
  });
});
