import { GassmaAggregateSelectionRequiredError } from "../../../errors/aggregate/aggregateError";
import {
  buildTestClient,
  clearSpreadsheetApp,
  sheetOf,
} from "../extends/extendsTestClient";

afterEach(() => {
  clearSpreadsheetApp();
});

const usersController = () => sheetOf(buildTestClient(), "Users");

describe("aggregate: 集計指定が1つも無ければエラー", () => {
  test("aggregate({}) はエラー", () => {
    const users = usersController();
    expect(() => users.aggregate({})).toThrow(
      GassmaAggregateSelectionRequiredError,
    );
  });

  test("aggregate() はエラー", () => {
    const users = usersController();
    // @ts-expect-error 引数必須のまま
    expect(() => users.aggregate()).toThrow(
      GassmaAggregateSelectionRequiredError,
    );
  });

  test("where だけではエラー", () => {
    const users = usersController();
    expect(() => users.aggregate({ where: { age: 20 } })).toThrow(
      GassmaAggregateSelectionRequiredError,
    );
  });

  test("orderBy だけではエラー", () => {
    const users = usersController();
    expect(() => users.aggregate({ orderBy: { age: "asc" } })).toThrow(
      GassmaAggregateSelectionRequiredError,
    );
  });

  test("take だけではエラー", () => {
    const users = usersController();
    expect(() => users.aggregate({ take: 1 })).toThrow(
      GassmaAggregateSelectionRequiredError,
    );
  });

  test("中身が空の集計指定は5キーすべてエラー", () => {
    const users = usersController();
    const emptySelections = [
      { _avg: {} },
      { _count: {} },
      { _max: {} },
      { _min: {} },
      { _sum: {} },
    ];
    emptySelections.forEach((aggregateData) => {
      expect(() => users.aggregate(aggregateData)).toThrow(
        GassmaAggregateSelectionRequiredError,
      );
    });
  });

  test("エラーメッセージは必要な指定が分かる内容", () => {
    const users = usersController();
    expect(() => users.aggregate({})).toThrow(
      "At least one aggregation is required: specify `_avg`, `_count`, `_max`, `_min`, or `_sum` with at least one field.",
    );
  });
});

describe("aggregate: 集計指定があれば従来どおり", () => {
  test("_avg 指定は従来どおり集計する", () => {
    const users = usersController();
    expect(users.aggregate({ _avg: { age: true } })).toEqual({
      _avg: { age: 30 },
    });
  });

  test("where + _count 指定は従来どおり集計する", () => {
    const users = usersController();
    expect(
      users.aggregate({ where: { age: 20 }, _count: { id: true } }),
    ).toEqual({ _count: { id: 1 } });
  });

  test("空の集計指定が混ざっていても、有効な集計指定があればエラーにしない", () => {
    const users = usersController();
    expect(users.aggregate({ _avg: {}, _count: { age: true } })).toEqual({
      _avg: {},
      _count: { age: 3 },
    });
  });
});

describe("aggregate: _count の true 省略形", () => {
  test("_count: true は全行数を数値で返す", () => {
    const users = usersController();
    expect(users.aggregate({ _count: true })).toEqual({ _count: 3 });
  });

  test("where + _count: true は絞り込んだ行数を数値で返す", () => {
    const users = usersController();
    expect(users.aggregate({ where: { age: 20 }, _count: true })).toEqual({
      _count: 1,
    });
  });
});

describe("aggregate: Select 型を通らない値の実行時挙動", () => {
  test("_count: false は集計指定なしと同じ扱いでエラー", () => {
    const users = usersController();
    // @ts-expect-error _count は Select | true のみ受け付ける
    expect(() => users.aggregate({ _count: false })).toThrow(
      GassmaAggregateSelectionRequiredError,
    );
  });
});
