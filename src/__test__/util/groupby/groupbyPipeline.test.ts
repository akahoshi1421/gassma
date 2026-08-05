import {
  GassmaMissingArgumentError,
  GassmaInvalidValueError,
  GassmaUnknownArgumentError,
} from "../../../errors/argument/argumentError";
import { groupByFunc } from "../../../util/groupby/groupby";
import {
  getExtendedMockControllerUtil,
  getNullableMockControllerUtil,
} from "../../consts/mockControllerUtil";

const extended = () => getExtendedMockControllerUtil();

describe("groupBy は orderBy / skip / take をグループに適用する", () => {
  test("take はグループ数を絞り、集計値を壊さない", () => {
    const result = groupByFunc(extended(), {
      by: "住所",
      _count: { 名前: true },
      orderBy: { 住所: "asc" },
      take: 2,
    });

    expect(result).toEqual([
      { 住所: "Kyoto", _count: { 名前: 2 } },
      { 住所: "Osaka", _count: { 名前: 2 } },
    ]);
  });

  test("skip はグループを飛ばし、集計値を壊さない", () => {
    const result = groupByFunc(extended(), {
      by: "住所",
      _count: { 名前: true },
      orderBy: { 住所: "asc" },
      skip: 1,
    });

    expect(result).toEqual([
      { 住所: "Osaka", _count: { 名前: 2 } },
      { 住所: "Tokyo", _count: { 名前: 4 } },
    ]);
  });

  test("orderBy はグループの並び順を決める", () => {
    const result = groupByFunc(extended(), {
      by: "住所",
      _count: { 名前: true },
      orderBy: { 住所: "desc" },
    });

    expect(result).toEqual([
      { 住所: "Tokyo", _count: { 名前: 4 } },
      { 住所: "Osaka", _count: { 名前: 2 } },
      { 住所: "Kyoto", _count: { 名前: 2 } },
    ]);
  });

  test("having の後に orderBy と take が適用される", () => {
    const result = groupByFunc(extended(), {
      by: "住所",
      _avg: { 年齢: true },
      having: { 年齢: { _avg: { lt: 40 } } },
      orderBy: { 住所: "asc" },
      take: 1,
    });

    expect(result).toEqual([{ 住所: "Kyoto", _avg: { 年齢: 36.5 } }]);
  });
});

describe("groupBy は集計値でソートできる", () => {
  test("_count でソートできる", () => {
    const result = groupByFunc(extended(), {
      by: "住所",
      _count: { 名前: true },
      orderBy: { _count: { 名前: "desc" } },
    });

    expect(result).toEqual([
      { 住所: "Tokyo", _count: { 名前: 4 } },
      { 住所: "Osaka", _count: { 名前: 2 } },
      { 住所: "Kyoto", _count: { 名前: 2 } },
    ]);
  });

  test("_sum でソートできる", () => {
    const result = groupByFunc(extended(), {
      by: "住所",
      _sum: { 年齢: true },
      orderBy: { _sum: { 年齢: "desc" } },
    });

    expect(result).toEqual([
      { 住所: "Tokyo", _sum: { 年齢: 109 } },
      { 住所: "Osaka", _sum: { 年齢: 87 } },
      { 住所: "Kyoto", _sum: { 年齢: 73 } },
    ]);
  });

  test("_avg でソートできる", () => {
    const result = groupByFunc(extended(), {
      by: "住所",
      _avg: { 年齢: true },
      orderBy: { _avg: { 年齢: "asc" } },
    });

    expect(result).toEqual([
      { 住所: "Tokyo", _avg: { 年齢: 27.25 } },
      { 住所: "Kyoto", _avg: { 年齢: 36.5 } },
      { 住所: "Osaka", _avg: { 年齢: 43.5 } },
    ]);
  });

  test("_max でソートできる", () => {
    const result = groupByFunc(extended(), {
      by: "住所",
      _max: { 年齢: true },
      orderBy: { _max: { 年齢: "desc" } },
    });

    expect(result).toEqual([
      { 住所: "Osaka", _max: { 年齢: 52 } },
      { 住所: "Kyoto", _max: { 年齢: 45 } },
      { 住所: "Tokyo", _max: { 年齢: 31 } },
    ]);
  });

  test("_min でソートできる", () => {
    const result = groupByFunc(extended(), {
      by: "住所",
      _min: { 年齢: true },
      orderBy: { _min: { 年齢: "asc" } },
    });

    expect(result).toEqual([
      { 住所: "Tokyo", _min: { 年齢: 22 } },
      { 住所: "Kyoto", _min: { 年齢: 28 } },
      { 住所: "Osaka", _min: { 年齢: 35 } },
    ]);
  });

  test("集計を選択していなくてもその集計でソートできる", () => {
    const result = groupByFunc(extended(), {
      by: "住所",
      orderBy: { _count: { 名前: "desc" } },
    });

    expect(result).toEqual([
      { 住所: "Tokyo" },
      { 住所: "Osaka" },
      { 住所: "Kyoto" },
    ]);
  });

  test("by に無い列の集計でもソートできる", () => {
    const result = groupByFunc(extended(), {
      by: "住所",
      orderBy: { _max: { 年齢: "desc" } },
    });

    expect(result).toEqual([
      { 住所: "Osaka" },
      { 住所: "Kyoto" },
      { 住所: "Tokyo" },
    ]);
  });

  test("配列で複合ソートできる", () => {
    const result = groupByFunc(extended(), {
      by: "住所",
      _count: { 名前: true },
      orderBy: [{ _count: { 名前: "desc" } }, { 住所: "asc" }],
    });

    expect(result).toEqual([
      { 住所: "Tokyo", _count: { 名前: 4 } },
      { 住所: "Kyoto", _count: { 名前: 2 } },
      { 住所: "Osaka", _count: { 名前: 2 } },
    ]);
  });
});

describe("groupBy の orderBy は by に無い列を拒否する", () => {
  test("by に無い列は単体でエラー", () => {
    expect(() =>
      groupByFunc(extended(), {
        by: "住所",
        _count: { 名前: true },
        orderBy: { 年齢: "asc" },
      }),
    ).toThrow(GassmaUnknownArgumentError);
  });

  test("配列の一部に by 外の列が混ざってもエラー", () => {
    expect(() =>
      groupByFunc(extended(), {
        by: "住所",
        _count: { 名前: true },
        orderBy: [{ 住所: "asc" }, { 年齢: "asc" }],
      }),
    ).toThrow(GassmaUnknownArgumentError);
  });

  test("存在しない列はエラー", () => {
    expect(() =>
      groupByFunc(extended(), {
        by: "住所",
        orderBy: { 存在しない: "asc" },
      }),
    ).toThrow(GassmaUnknownArgumentError);
  });

  test("集計の中の存在しない列はエラー", () => {
    expect(() =>
      groupByFunc(extended(), {
        by: "住所",
        orderBy: { _count: { 存在しない: "asc" } },
      }),
    ).toThrow(GassmaUnknownArgumentError);
  });

  test("_count の _all ではソートできない", () => {
    expect(() =>
      groupByFunc(extended(), {
        by: "住所",
        _count: { _all: true },
        orderBy: { _count: { _all: "desc" } },
      }),
    ).toThrow(GassmaUnknownArgumentError);
  });

  test("空の集計オブジェクトはエラー", () => {
    expect(() =>
      groupByFunc(extended(), {
        by: "住所",
        orderBy: { _count: {} },
      }),
    ).toThrow(GassmaInvalidValueError);
  });

  test("フィールドを指定しない集計はエラー", () => {
    expect(() =>
      groupByFunc(extended(), {
        by: "住所",
        orderBy: { _count: "desc" },
      }),
    ).toThrow(GassmaInvalidValueError);
  });
});

describe("groupBy の take / skip は orderBy を要求する", () => {
  test("take 単体はエラー", () => {
    expect(() =>
      groupByFunc(extended(), {
        by: "住所",
        _count: { 名前: true },
        take: 2,
      }),
    ).toThrow(GassmaMissingArgumentError);
  });

  test("take: 0 単体もエラー", () => {
    expect(() =>
      groupByFunc(extended(), {
        by: "住所",
        _count: { 名前: true },
        take: 0,
      }),
    ).toThrow(GassmaMissingArgumentError);
  });

  test("skip 単体はエラー", () => {
    expect(() =>
      groupByFunc(extended(), {
        by: "住所",
        _count: { 名前: true },
        skip: 3,
      }),
    ).toThrow(GassmaMissingArgumentError);
  });

  test("skip: 0 と take の組み合わせもエラー", () => {
    expect(() =>
      groupByFunc(extended(), {
        by: "住所",
        _count: { 名前: true },
        skip: 0,
        take: 2,
      }),
    ).toThrow(GassmaMissingArgumentError);
  });

  test("空の orderBy は orderBy として数えない", () => {
    expect(() =>
      groupByFunc(extended(), {
        by: "住所",
        _count: { 名前: true },
        orderBy: {},
        take: 2,
      }),
    ).toThrow(GassmaMissingArgumentError);
  });

  test("空配列の orderBy も orderBy として数えない", () => {
    expect(() =>
      groupByFunc(extended(), {
        by: "住所",
        _count: { 名前: true },
        orderBy: [],
        take: 2,
      }),
    ).toThrow(GassmaMissingArgumentError);
  });

  test("空エントリだけの orderBy 配列も orderBy として数えない", () => {
    expect(() =>
      groupByFunc(extended(), {
        by: "住所",
        _count: { 名前: true },
        orderBy: [{}],
        take: 2,
      }),
    ).toThrow(GassmaMissingArgumentError);
  });

  test("skip: 0 単体はエラーにならず全グループが返る", () => {
    const result = groupByFunc(extended(), {
      by: "住所",
      _count: { 名前: true },
      skip: 0,
    });

    expect(result).toEqual([
      { 住所: "Tokyo", _count: { 名前: 4 } },
      { 住所: "Osaka", _count: { 名前: 2 } },
      { 住所: "Kyoto", _count: { 名前: 2 } },
    ]);
  });

  test("非空エントリが1つでもあれば空エントリは無視される", () => {
    const result = groupByFunc(extended(), {
      by: "住所",
      _count: { 名前: true },
      orderBy: [{ 住所: "asc" }, {}],
      take: 2,
    });

    expect(result).toEqual([
      { 住所: "Kyoto", _count: { 名前: 2 } },
      { 住所: "Osaka", _count: { 名前: 2 } },
    ]);
  });
});

describe("groupBy の負の take は反転順のまま返す", () => {
  test("take: -1 は末尾のグループ", () => {
    const result = groupByFunc(extended(), {
      by: "住所",
      _count: { 名前: true },
      orderBy: { 住所: "asc" },
      take: -1,
    });

    expect(result).toEqual([{ 住所: "Tokyo", _count: { 名前: 4 } }]);
  });

  test("take: -2 は反転順のまま2グループ", () => {
    const result = groupByFunc(extended(), {
      by: "住所",
      _count: { 名前: true },
      orderBy: { 住所: "asc" },
      take: -2,
    });

    expect(result).toEqual([
      { 住所: "Tokyo", _count: { 名前: 4 } },
      { 住所: "Osaka", _count: { 名前: 2 } },
    ]);
  });

  test("take: -2 と skip の組み合わせ", () => {
    const result = groupByFunc(extended(), {
      by: "住所",
      _count: { 名前: true },
      orderBy: { 住所: "asc" },
      take: -2,
      skip: 1,
    });

    expect(result).toEqual([
      { 住所: "Osaka", _count: { 名前: 2 } },
      { 住所: "Kyoto", _count: { 名前: 2 } },
    ]);
  });
});

describe("groupBy の orderBy は nulls 指定を受け付ける", () => {
  test("nulls: first", () => {
    const result = groupByFunc(getNullableMockControllerUtil(), {
      by: "メモ",
      _count: { カテゴリ: true },
      orderBy: { メモ: { sort: "asc", nulls: "first" } },
    });

    expect(result).toEqual([
      { メモ: null, _count: { カテゴリ: 1 } },
      { メモ: "m1", _count: { カテゴリ: 1 } },
      { メモ: "m2", _count: { カテゴリ: 1 } },
    ]);
  });

  test("nulls: last", () => {
    const result = groupByFunc(getNullableMockControllerUtil(), {
      by: "メモ",
      _count: { カテゴリ: true },
      orderBy: { メモ: { sort: "asc", nulls: "last" } },
    });

    expect(result).toEqual([
      { メモ: "m1", _count: { カテゴリ: 1 } },
      { メモ: "m2", _count: { カテゴリ: 1 } },
      { メモ: null, _count: { カテゴリ: 1 } },
    ]);
  });
});
