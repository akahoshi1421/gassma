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

describe("aggregateFunc の _sum/_avg/_max/_min キー検証", () => {
  test("_sum の typo 列は null を返さずエラーになりサジェストが出る", () => {
    const fn = () =>
      aggregateFunc(getExtendedMockControllerUtil(), {
        _sum: { 年令: true },
      });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow("Unknown argument `年令`. Did you mean `年齢`?");
  });

  test("_avg の typo 列はエラー", () => {
    const fn = () =>
      aggregateFunc(getExtendedMockControllerUtil(), {
        _avg: { 年令: true },
      });
    expect(fn).toThrow(GassmaUnknownArgumentError);
  });

  test("_max の存在しない列はエラー", () => {
    const fn = () =>
      aggregateFunc(getExtendedMockControllerUtil(), {
        _max: { 存在しない列: true },
      });
    expect(fn).toThrow(GassmaUnknownArgumentError);
  });

  test("_min の存在しない列はエラー", () => {
    const fn = () =>
      aggregateFunc(getExtendedMockControllerUtil(), {
        _min: { 存在しない列: true },
      });
    expect(fn).toThrow(GassmaUnknownArgumentError);
  });

  test("_sum に _all は指定できない", () => {
    const fn = () =>
      aggregateLoose(getExtendedMockControllerUtil(), {
        _sum: { _all: true },
      });
    expect(fn).toThrow(GassmaUnknownArgumentError);
  });

  test("_sum: {} は有効な _count と同居してもエラー", () => {
    const fn = () =>
      aggregateFunc(getExtendedMockControllerUtil(), {
        _sum: {},
        _count: { 年齢: true },
      });
    expect(fn).toThrow(GassmaInvalidValueError);
    expect(fn).toThrow("Expected a non-empty object");
  });

  test("falsy のみはエラー(truthy が1つ必要)", () => {
    const fn = () =>
      aggregateLoose(getExtendedMockControllerUtil(), {
        _sum: { 年齢: false },
        _count: { 年齢: true },
      });
    expect(fn).toThrow(GassmaInvalidValueError);
    expect(fn).toThrow("Expected at least one truthy value");
  });

  test("false のキーでも未知キーはエラー", () => {
    const fn = () =>
      aggregateLoose(getExtendedMockControllerUtil(), {
        _sum: { 年令: false, 年齢: true },
      });
    expect(fn).toThrow(GassmaUnknownArgumentError);
  });

  test("truthy と falsy の混在は falsy キーを結果から除外する", () => {
    const result = aggregateLoose(getExtendedMockControllerUtil(), {
      _sum: { 年齢: true, 名前: false },
    });
    expect(result).toEqual({ _sum: { 年齢: 269 } });
  });

  test("ignore された列は指定できない", () => {
    const util = {
      ...getNullableMockControllerUtil(),
      whereValidation: { ignoredFields: ["メモ"], relationNames: [] },
    };
    const fn = () => aggregateFunc(util, { _max: { メモ: true } });
    expect(fn).toThrow(GassmaUnknownArgumentError);
  });

  test("正しい列名は従来どおり集計する", () => {
    const result = aggregateFunc(getExtendedMockControllerUtil(), {
      _sum: { 年齢: true },
      _avg: { 年齢: true },
      _max: { 年齢: true },
      _min: { 年齢: true },
    });
    expect(result).toEqual({
      _sum: { 年齢: 269 },
      _avg: { 年齢: 269 / 8 },
      _max: { 年齢: 52 },
      _min: { 年齢: 22 },
    });
  });
});

describe("GassmaController 経由の aggregate _sum/_avg/_max/_min キー検証", () => {
  test("typo キーは null でなくエラー", () => {
    const users = sheetOf(buildTestClient(), "Users");
    const loose: any = users;
    const fn = () => loose.aggregate({ _sum: { aeg: true } });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow("Unknown argument `aeg`");
  });

  test("正しい列名は従来どおり集計する", () => {
    const users = sheetOf(buildTestClient(), "Users");
    expect(
      users.aggregate({ _avg: { age: true }, _max: { age: true } }),
    ).toEqual({
      _avg: { age: 30 },
      _max: { age: 40 },
    });
  });

  test("$transaction 経由でも検証が効く", () => {
    const env = buildTxTestEnv();
    const tx = (env.client as any).$transaction.bind(env.client);
    const fn = () =>
      tx((txClient: any) => txClient.Users.aggregate({ _max: { nmae: true } }));
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
    expect(() => loose.aggregate({ _min: { nmae: true } })).toThrow(
      GassmaUnknownArgumentError,
    );
  });
});
