import {
  GassmaInvalidValueError,
  GassmaUnknownArgumentError,
} from "../../../errors/argument/argumentError";
import { countFunc } from "../../../util/count/count";
import {
  getExtendedMockControllerUtil,
  getNullableMockControllerUtil,
} from "../../consts/mockControllerUtil";
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

describe("countFunc の select", () => {
  test("_all: true は全行数をオブジェクトで返す", () => {
    const result = countFunc(getExtendedMockControllerUtil(), {
      select: { _all: true },
    });
    expect(result).toEqual({ _all: 8 });
  });

  test("nullable 列は null 行を除外して数える", () => {
    const result = countFunc(getNullableMockControllerUtil(), {
      select: { メモ: true },
    });
    expect(result).toEqual({ メモ: 2 });
  });

  test("全行 null の列は 0", () => {
    const result = countFunc(getNullableMockControllerUtil(), {
      select: { 備考: true },
    });
    expect(result).toEqual({ 備考: 0 });
  });

  test("非 null 列は全行数になる", () => {
    const result = countFunc(getNullableMockControllerUtil(), {
      select: { カテゴリ: true },
    });
    expect(result).toEqual({ カテゴリ: 3 });
  });

  test("_all と列名の混在は各キーが独立に数えられる", () => {
    const result = countFunc(getNullableMockControllerUtil(), {
      select: { _all: true, メモ: true },
    });
    expect(result).toEqual({ _all: 3, メモ: 2 });
  });

  test("where と併用できる", () => {
    const result = countFunc(getExtendedMockControllerUtil(), {
      where: { 住所: "Tokyo" },
      select: { _all: true },
    });
    expect(result).toEqual({ _all: 4 });
  });

  test("select: true は素の数値を返す", () => {
    expect(countFunc(getExtendedMockControllerUtil(), { select: true })).toBe(
      8,
    );
  });

  test("select なしは従来どおり素の数値", () => {
    expect(countFunc(getExtendedMockControllerUtil(), {})).toBe(8);
  });

  test("false のキーは結果から除外される", () => {
    const result = countFunc(getNullableMockControllerUtil(), {
      select: { メモ: false, カテゴリ: true },
    });
    expect(result).toEqual({ カテゴリ: 3 });
  });

  test("falsy のみはエラー(truthy が1つ必要)", () => {
    const fn = () =>
      countFunc(getNullableMockControllerUtil(), {
        select: { メモ: false },
      });
    expect(fn).toThrow(GassmaInvalidValueError);
    expect(fn).toThrow("Expected at least one truthy value");
  });

  test("空オブジェクトはエラー", () => {
    const fn = () => countFunc(getNullableMockControllerUtil(), { select: {} });
    expect(fn).toThrow(GassmaInvalidValueError);
    expect(fn).toThrow("Expected a non-empty object");
  });

  test("_al (typo) は偽のゼロを返さずエラーになりサジェストが出る", () => {
    const fn = () =>
      countFunc(getExtendedMockControllerUtil(), {
        select: { _al: true },
      });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow("Unknown argument `_al`. Did you mean `_all`?");
  });

  test("存在しない列はエラー", () => {
    const fn = () =>
      countFunc(getExtendedMockControllerUtil(), {
        select: { 存在しない列: true },
      });
    expect(fn).toThrow(GassmaUnknownArgumentError);
  });

  test("_count は select 内では使えない(Prisma と同じ)", () => {
    const fn = () =>
      countFunc(getExtendedMockControllerUtil(), {
        select: { _count: true },
      });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow("Unknown argument `_count`.");
  });

  test("false のキーでも未知キーはエラー", () => {
    const fn = () =>
      countFunc(getExtendedMockControllerUtil(), {
        select: { _al: false, _all: true },
      });
    expect(fn).toThrow(GassmaUnknownArgumentError);
  });

  test("ignore された列は select できない", () => {
    const util = {
      ...getNullableMockControllerUtil(),
      whereValidation: { ignoredFields: ["メモ"], relationNames: [] },
    };
    const fn = () => countFunc(util, { select: { メモ: true } });
    expect(fn).toThrow(GassmaUnknownArgumentError);
  });
});

describe("GassmaController 経由の count select", () => {
  test("select: { _all: true } がオブジェクトを返す", () => {
    const users = sheetOf(buildTestClient(), "Users");
    expect(users.count({ select: { _all: true } })).toEqual({ _all: 3 });
  });

  test("select: { 列名: true } が非 null 件数を返す", () => {
    const users = sheetOf(buildTestClient(), "Users");
    expect(users.count({ select: { name: true } })).toEqual({ name: 3 });
  });

  test("where と併用できる", () => {
    const users = sheetOf(buildTestClient(), "Users");
    expect(
      users.count({ where: { age: { gte: 30 } }, select: { _all: true } }),
    ).toEqual({ _all: 2 });
  });

  test("引数なしの count() は従来どおり数値", () => {
    const users = sheetOf(buildTestClient(), "Users");
    expect(users.count()).toBe(3);
    expect(users.count({})).toBe(3);
  });

  test("typo キーは偽のゼロでなくエラー", () => {
    const users = sheetOf(buildTestClient(), "Users");
    const loose: any = users;
    const fn = () => loose.count({ select: { nmae: true } });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow("Unknown argument `nmae`. Did you mean `name`?");
  });

  test("$transaction 経由でも select が効く", () => {
    const env = buildTxTestEnv();
    const tx = (env.client as any).$transaction.bind(env.client);
    const result = tx((txClient: any) =>
      txClient.Users.count({ select: { _all: true, name: true } }),
    );
    expect(result).toEqual({ _all: 2, name: 2 });
  });

  test("$extends の query フック経由でも select が効く", () => {
    const client = buildTestClient();
    const extended = client.$extends({
      query: {
        Users: {
          count({ args, query }) {
            return query(args);
          },
        },
      },
    });
    expect(extended.Users.count({ select: { _all: true } })).toEqual({
      _all: 3,
    });
  });
});
