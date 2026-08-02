import {
  GassmaInvalidValueError,
  GassmaUnknownArgumentError,
} from "../../../errors/argument/argumentError";
import { groupByFunc } from "../../../util/groupby/groupby";
import {
  getExtendedMockControllerUtil,
  getNullableMockControllerUtil,
} from "../../consts/mockControllerUtil";
import {
  buildTestClient,
  clearSpreadsheetApp,
  sheetOf,
} from "../extends/extendsTestClient";
import { expectArrayToEqualIgnoringOrder } from "../../helpers/matchers";

afterEach(() => {
  clearSpreadsheetApp();
});

const groupByLoose: (util: any, data: any) => any = groupByFunc;

describe("groupByFunc の _count キー検証", () => {
  test("_al (typo) は偽のゼロを返さずエラーになりサジェストが出る", () => {
    const fn = () =>
      groupByFunc(getExtendedMockControllerUtil(), {
        by: "住所",
        _count: { _al: true },
      });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow("Unknown argument `_al`. Did you mean `_all`?");
  });

  test("存在しない列はエラー", () => {
    const fn = () =>
      groupByFunc(getExtendedMockControllerUtil(), {
        by: "住所",
        _count: { 存在しない列: true },
      });
    expect(fn).toThrow(GassmaUnknownArgumentError);
  });

  test("false のキーでも未知キーはエラー", () => {
    const fn = () =>
      groupByLoose(getExtendedMockControllerUtil(), {
        by: "住所",
        _count: { _al: false, _all: true },
      });
    expect(fn).toThrow(GassmaUnknownArgumentError);
  });

  test("_count: {} はエラー", () => {
    const fn = () =>
      groupByFunc(getExtendedMockControllerUtil(), {
        by: "住所",
        _count: {},
      });
    expect(fn).toThrow(GassmaInvalidValueError);
    expect(fn).toThrow("Expected a non-empty object");
  });

  test("falsy のみはエラー(truthy が1つ必要)", () => {
    const fn = () =>
      groupByLoose(getExtendedMockControllerUtil(), {
        by: "住所",
        _count: { 名前: false },
      });
    expect(fn).toThrow(GassmaInvalidValueError);
    expect(fn).toThrow("Expected at least one truthy value");
  });

  test("truthy と falsy の混在は falsy キーを結果から除外する", () => {
    const result = groupByLoose(getNullableMockControllerUtil(), {
      by: "カテゴリ",
      _count: { メモ: false, _all: true },
    });
    expectArrayToEqualIgnoringOrder(result, [
      { カテゴリ: "a", _count: { _all: 2 } },
      { カテゴリ: "b", _count: { _all: 1 } },
    ]);
  });

  test("ignore された列は _count できない", () => {
    const util = {
      ...getNullableMockControllerUtil(),
      whereValidation: { ignoredFields: ["メモ"], relationNames: [] },
    };
    const fn = () =>
      groupByFunc(util, { by: "カテゴリ", _count: { メモ: true } });
    expect(fn).toThrow(GassmaUnknownArgumentError);
  });

  test("_count: true はグループごとの行数を数値で返す", () => {
    const result = groupByFunc(getNullableMockControllerUtil(), {
      by: "カテゴリ",
      _count: true,
    });
    expectArrayToEqualIgnoringOrder(result, [
      { カテゴリ: "a", _count: 2 },
      { カテゴリ: "b", _count: 1 },
    ]);
  });

  test("_all と列名の指定は従来どおり集計する", () => {
    const result = groupByFunc(getNullableMockControllerUtil(), {
      by: "カテゴリ",
      _count: { _all: true, メモ: true },
    });
    expectArrayToEqualIgnoringOrder(result, [
      { カテゴリ: "a", _count: { _all: 2, メモ: 1 } },
      { カテゴリ: "b", _count: { _all: 1, メモ: 1 } },
    ]);
  });
});

describe("GassmaController 経由の groupBy _count キー検証", () => {
  test("typo キーは偽のゼロでなくエラー", () => {
    const users = sheetOf(buildTestClient(), "Users");
    const loose: any = users;
    const fn = () => loose.groupBy({ by: ["name"], _count: { nmae: true } });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow("Unknown argument `nmae`. Did you mean `name`?");
  });

  test("正しい列名は従来どおり集計する", () => {
    const users = sheetOf(buildTestClient(), "Users");
    const result = users.groupBy({ by: ["name"], _count: { _all: true } });
    expect(Array.isArray(result)).toBe(true);
    (result as any[]).forEach((row) => {
      expect(row._count).toEqual({ _all: 1 });
    });
  });
});
