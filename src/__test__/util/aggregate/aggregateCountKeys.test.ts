import { GassmaAggregateSelectionRequiredError } from "../../../errors/aggregate/aggregateError";
import {
  GassmaInvalidValueError,
  GassmaUnknownArgumentError,
} from "../../../errors/argument/argumentError";
import { aggregateFunc } from "../../../util/aggregate/aggregate";
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

const aggregateLoose: (util: any, data: any) => any = aggregateFunc;

describe("aggregateFunc の _count キー検証", () => {
  test("_al (typo) は偽のゼロを返さずエラーになりサジェストが出る", () => {
    const fn = () =>
      aggregateFunc(getExtendedMockControllerUtil(), {
        _count: { _al: true },
      });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow("Unknown argument `_al`. Did you mean `_all`?");
  });

  test("存在しない列はエラー", () => {
    const fn = () =>
      aggregateFunc(getExtendedMockControllerUtil(), {
        _count: { 存在しない列: true },
      });
    expect(fn).toThrow(GassmaUnknownArgumentError);
  });

  test("false のキーでも未知キーはエラー", () => {
    const fn = () =>
      aggregateLoose(getExtendedMockControllerUtil(), {
        _count: { _al: false, _all: true },
      });
    expect(fn).toThrow(GassmaUnknownArgumentError);
  });

  test("_count: {} は _sum と同居してもエラー", () => {
    const fn = () =>
      aggregateFunc(getExtendedMockControllerUtil(), {
        _count: {},
        _sum: { 年齢: true },
      });
    expect(fn).toThrow(GassmaInvalidValueError);
    expect(fn).toThrow("Expected a non-empty object");
  });

  test("falsy のみはエラー(truthy が1つ必要)", () => {
    const fn = () =>
      aggregateLoose(getExtendedMockControllerUtil(), {
        _count: { 名前: false },
      });
    expect(fn).toThrow(GassmaInvalidValueError);
    expect(fn).toThrow("Expected at least one truthy value");
  });

  test("falsy のみは _sum と同居してもエラー", () => {
    const fn = () =>
      aggregateLoose(getExtendedMockControllerUtil(), {
        _count: { 名前: false },
        _sum: { 年齢: true },
      });
    expect(fn).toThrow(GassmaInvalidValueError);
  });

  test("truthy と falsy の混在は falsy キーを結果から除外する", () => {
    const result = aggregateLoose(getExtendedMockControllerUtil(), {
      _count: { 名前: false, 年齢: true },
    });
    expect(result).toEqual({ _count: { 年齢: 8 } });
  });

  test("ignore された列は _count できない", () => {
    const util = {
      ...getNullableMockControllerUtil(),
      whereValidation: { ignoredFields: ["メモ"], relationNames: [] },
    };
    const fn = () => aggregateFunc(util, { _count: { メモ: true } });
    expect(fn).toThrow(GassmaUnknownArgumentError);
  });

  test("_count: {} 単独は従来どおり集計指定なしエラー", () => {
    const fn = () =>
      aggregateFunc(getExtendedMockControllerUtil(), { _count: {} });
    expect(fn).toThrow(GassmaAggregateSelectionRequiredError);
  });

  test("_count: true は従来どおり全行数を数値で返す", () => {
    const result = aggregateFunc(getExtendedMockControllerUtil(), {
      _count: true,
    });
    expect(result).toEqual({ _count: 8 });
  });

  test("_all と列名の指定は従来どおり集計する", () => {
    const result = aggregateFunc(getNullableMockControllerUtil(), {
      _count: { _all: true, メモ: true },
    });
    expect(result).toEqual({ _count: { _all: 3, メモ: 2 } });
  });

  test("where と併用しても従来どおり", () => {
    const result = aggregateFunc(getExtendedMockControllerUtil(), {
      where: { 住所: "Tokyo" },
      _count: { _all: true },
    });
    expect(result).toEqual({ _count: { _all: 4 } });
  });
});

describe("GassmaController 経由の aggregate _count キー検証", () => {
  test("typo キーは偽のゼロでなくエラー", () => {
    const users = sheetOf(buildTestClient(), "Users");
    const loose: any = users;
    const fn = () => loose.aggregate({ _count: { nmae: true } });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow("Unknown argument `nmae`. Did you mean `name`?");
  });

  test("正しい列名は従来どおり集計する", () => {
    const users = sheetOf(buildTestClient(), "Users");
    expect(users.aggregate({ _count: { _all: true, name: true } })).toEqual({
      _count: { _all: 3, name: 3 },
    });
  });

  test("$transaction 経由でも検証が効く", () => {
    const env = buildTxTestEnv();
    const tx = (env.client as any).$transaction.bind(env.client);
    const fn = () =>
      tx((txClient: any) =>
        txClient.Users.aggregate({ _count: { _al: true } }),
      );
    expect(fn).toThrow(GassmaUnknownArgumentError);
  });

  test("$extends の query フック経由でも検証が効く", () => {
    const client = buildTestClient();
    const extended = client.$extends({
      query: {
        Users: {
          aggregate({ args, query }) {
            return query(args);
          },
        },
      },
    });
    const loose: any = extended.Users;
    expect(() => loose.aggregate({ _count: { _al: true } })).toThrow(
      GassmaUnknownArgumentError,
    );
  });
});
