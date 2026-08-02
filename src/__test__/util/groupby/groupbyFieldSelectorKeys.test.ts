import {
  GassmaInvalidValueError,
  GassmaUnknownArgumentError,
} from "../../../errors/argument/argumentError";
import { groupByFunc } from "../../../util/groupby/groupby";
import {
  getExtendedMockControllerUtil,
  getNullableMockControllerUtil,
} from "../../consts/mockControllerUtil";
import { expectArrayToEqualIgnoringOrder } from "../../helpers/matchers";
import {
  buildTestClient,
  clearSpreadsheetApp,
  sheetOf,
} from "../extends/extendsTestClient";

afterEach(() => {
  clearSpreadsheetApp();
});

const groupByLoose: (util: any, data: any) => any = groupByFunc;

describe("groupByFunc の _sum/_avg/_max/_min キー検証", () => {
  test("_sum の typo 列は null を返さずエラーになりサジェストが出る", () => {
    const fn = () =>
      groupByFunc(getExtendedMockControllerUtil(), {
        by: "住所",
        _sum: { 年令: true },
      });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow("Unknown argument `年令`. Did you mean `年齢`?");
  });

  test("_avg の存在しない列はエラー", () => {
    const fn = () =>
      groupByFunc(getExtendedMockControllerUtil(), {
        by: "住所",
        _avg: { 存在しない列: true },
      });
    expect(fn).toThrow(GassmaUnknownArgumentError);
  });

  test("_max に _all は指定できない", () => {
    const fn = () =>
      groupByLoose(getExtendedMockControllerUtil(), {
        by: "住所",
        _max: { _all: true },
      });
    expect(fn).toThrow(GassmaUnknownArgumentError);
  });

  test("_sum: {} はエラー", () => {
    const fn = () =>
      groupByFunc(getExtendedMockControllerUtil(), {
        by: "住所",
        _sum: {},
      });
    expect(fn).toThrow(GassmaInvalidValueError);
    expect(fn).toThrow("Expected a non-empty object");
  });

  test("falsy のみはエラー(truthy が1つ必要)", () => {
    const fn = () =>
      groupByLoose(getExtendedMockControllerUtil(), {
        by: "住所",
        _min: { 年齢: false },
      });
    expect(fn).toThrow(GassmaInvalidValueError);
    expect(fn).toThrow("Expected at least one truthy value");
  });

  test("false のキーでも未知キーはエラー", () => {
    const fn = () =>
      groupByLoose(getExtendedMockControllerUtil(), {
        by: "住所",
        _sum: { 年令: false, 年齢: true },
      });
    expect(fn).toThrow(GassmaUnknownArgumentError);
  });

  test("truthy と falsy の混在は falsy キーを結果から除外する", () => {
    const result = groupByLoose(getExtendedMockControllerUtil(), {
      by: "住所",
      _max: { 年齢: true, 名前: false },
    });
    expectArrayToEqualIgnoringOrder(result, [
      { 住所: "Tokyo", _max: { 年齢: 31 } },
      { 住所: "Osaka", _max: { 年齢: 52 } },
      { 住所: "Kyoto", _max: { 年齢: 45 } },
    ]);
  });

  test("ignore された列は指定できない", () => {
    const util = {
      ...getNullableMockControllerUtil(),
      whereValidation: { ignoredFields: ["メモ"], relationNames: [] },
    };
    const fn = () =>
      groupByFunc(util, { by: "カテゴリ", _min: { メモ: true } });
    expect(fn).toThrow(GassmaUnknownArgumentError);
  });

  test("正しい列名は従来どおり集計する", () => {
    const result = groupByFunc(getExtendedMockControllerUtil(), {
      by: "住所",
      _sum: { 年齢: true },
    });
    expectArrayToEqualIgnoringOrder(result, [
      { 住所: "Tokyo", _sum: { 年齢: 109 } },
      { 住所: "Osaka", _sum: { 年齢: 87 } },
      { 住所: "Kyoto", _sum: { 年齢: 73 } },
    ]);
  });
});

describe("GassmaController 経由の groupBy _sum/_avg/_max/_min キー検証", () => {
  test("typo キーは null でなくエラー", () => {
    const users = sheetOf(buildTestClient(), "Users");
    const loose: any = users;
    const fn = () => loose.groupBy({ by: ["name"], _sum: { aeg: true } });
    expect(fn).toThrow(GassmaUnknownArgumentError);
    expect(fn).toThrow("Unknown argument `aeg`");
  });

  test("正しい列名は従来どおり集計する", () => {
    const users = sheetOf(buildTestClient(), "Users");
    const result = users.groupBy({ by: ["name"], _max: { age: true } });
    expect(Array.isArray(result)).toBe(true);
    expectArrayToEqualIgnoringOrder(result, [
      { name: "Alice", _max: { age: 20 } },
      { name: "Bob", _max: { age: 30 } },
      { name: "Carol", _max: { age: 40 } },
    ]);
  });
});
