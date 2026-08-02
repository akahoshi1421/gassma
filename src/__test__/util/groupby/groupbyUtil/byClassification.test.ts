import { byClassification } from "../../../../util/groupby/groubyUtil/by";

describe("byClassification のグループ順・行順", () => {
  test("グループは初出順に並ぶ", () => {
    const rows = [
      { k: "b", v: 1 },
      { k: "a", v: 2 },
      { k: "b", v: 3 },
      { k: "c", v: 4 },
      { k: "a", v: 5 },
    ];

    const result = byClassification(rows, ["k"]);

    expect(result.map((group: { k: string }[]) => group[0].k)).toEqual([
      "b",
      "a",
      "c",
    ]);
  });

  test("グループ内の行は元の順序を保つ", () => {
    const rows = [
      { k: "a", v: 1 },
      { k: "b", v: 2 },
      { k: "a", v: 3 },
      { k: "a", v: 4 },
    ];

    const result = byClassification(rows, ["k"]);

    expect(result[0].map((row: { v: number }) => row.v)).toEqual([1, 3, 4]);
  });

  test("グループ内の行は同一参照", () => {
    const rows = [
      { k: "a", v: 1 },
      { k: "a", v: 2 },
    ];

    const result = byClassification(rows, ["k"]);

    expect(result[0][0]).toBe(rows[0]);
    expect(result[0][1]).toBe(rows[1]);
  });

  test("全行同一キーなら1グループ", () => {
    const rows = [{ k: 1 }, { k: 1 }, { k: 1 }];

    const result = byClassification(rows, ["k"]);

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveLength(3);
  });

  test("全行ユニークなら行数ぶんのグループ", () => {
    const rows = [{ k: 1 }, { k: 2 }, { k: 3 }];

    const result = byClassification(rows, ["k"]);

    expect(result).toHaveLength(3);
    expect(result.every((group: unknown[]) => group.length === 1)).toBe(true);
  });

  test("空の入力は空の結果", () => {
    expect(byClassification([], ["k"])).toEqual([]);
  });
});

describe("byClassification の型区別", () => {
  test('数値 0 と文字列 "0" は別グループ', () => {
    const rows = [{ k: 0 }, { k: "0" }];

    expect(byClassification(rows, ["k"])).toHaveLength(2);
  });

  test("true と 1 は別グループ", () => {
    const rows = [{ k: true }, { k: 1 }];

    expect(byClassification(rows, ["k"])).toHaveLength(2);
  });

  test("null と undefined と空文字は別グループ", () => {
    const rows = [{ k: null }, { k: undefined }, { k: "" }];

    expect(byClassification(rows, ["k"])).toHaveLength(3);
  });

  test("-0 と 0 は同一グループ", () => {
    const rows = [{ k: -0 }, { k: 0 }];

    expect(byClassification(rows, ["k"])).toHaveLength(1);
  });

  test("負数・小数はそれぞれ区別される", () => {
    const rows = [{ k: -1 }, { k: 1 }, { k: 1.5 }, { k: -1 }];

    const result = byClassification(rows, ["k"]);

    expect(result).toHaveLength(3);
    expect(result[0]).toHaveLength(2);
  });

  test("正規化キー形式の文字列は Date と衝突しない", () => {
    const at = new Date("2026-07-18T09:30:00.000Z");
    const rows = [{ k: at }, { k: `date:${at.getTime()}` }];

    expect(byClassification(rows, ["k"])).toHaveLength(2);
  });

  test('文字列 "str:1" と "1" は別グループ', () => {
    const rows = [{ k: "str:1" }, { k: "1" }];

    expect(byClassification(rows, ["k"])).toHaveLength(2);
  });
});

describe("byClassification の NaN / Invalid Date", () => {
  test("NaN の行は初出位置の1グループにまとまる", () => {
    const rows = [
      { k: 1, v: "a" },
      { k: NaN, v: "b" },
      { k: 2, v: "c" },
      { k: NaN, v: "d" },
    ];

    const result = byClassification(rows, ["k"]);

    expect(result).toEqual([
      [{ k: 1, v: "a" }],
      [
        { k: NaN, v: "b" },
        { k: NaN, v: "d" },
      ],
      [{ k: 2, v: "c" }],
    ]);
  });

  test("Invalid Date は別インスタンスでも1グループにまとまる", () => {
    const shared = new Date("invalid");
    const another = new Date("invalid");
    const rows = [
      { k: shared, v: "a" },
      { k: shared, v: "b" },
      { k: another, v: "c" },
      { k: 1, v: "d" },
    ];

    const result = byClassification(rows, ["k"]);

    expect(result).toEqual([
      [
        { k: shared, v: "a" },
        { k: shared, v: "b" },
        { k: another, v: "c" },
      ],
      [{ k: 1, v: "d" }],
    ]);
  });

  test("深さ2: 非最終カラムの NaN 行も消えない", () => {
    const rows = [
      { a: NaN, b: 1, v: "x" },
      { a: 1, b: 1, v: "y" },
      { a: NaN, b: 2, v: "z" },
    ];

    const result = byClassification(rows, ["a", "b"]);

    expect(result).toEqual([
      [{ a: NaN, b: 1, v: "x" }],
      [{ a: NaN, b: 2, v: "z" }],
      [{ a: 1, b: 1, v: "y" }],
    ]);
  });

  test("深さ2: 最終カラムの NaN も1グループになる", () => {
    const rows = [
      { a: 1, b: NaN, v: "x" },
      { a: 1, b: 2, v: "y" },
      { a: 1, b: NaN, v: "z" },
    ];

    const result = byClassification(rows, ["a", "b"]);

    expect(result).toEqual([
      [
        { a: 1, b: NaN, v: "x" },
        { a: 1, b: NaN, v: "z" },
      ],
      [{ a: 1, b: 2, v: "y" }],
    ]);
  });

  test("NaN と null は別グループ", () => {
    const rows = [{ k: NaN }, { k: null }, { k: NaN }];

    const result = byClassification(rows, ["k"]);

    expect(result).toEqual([[{ k: NaN }, { k: NaN }], [{ k: null }]]);
  });

  test("Invalid Date と NaN は別グループ", () => {
    const invalid = new Date("invalid");
    const rows = [{ k: invalid }, { k: NaN }];

    expect(byClassification(rows, ["k"])).toHaveLength(2);
  });
});

describe("byClassification の複数カラム", () => {
  test("深さ2: 外側カラム初出順→内側カラム初出順で平坦化される", () => {
    const rows = [
      { a: "x", b: 1, v: 1 },
      { a: "y", b: 1, v: 2 },
      { a: "x", b: 2, v: 3 },
      { a: "x", b: 1, v: 4 },
      { a: "y", b: 3, v: 5 },
    ];

    const result = byClassification(rows, ["a", "b"]);

    expect(
      result.map((group: { a: string; b: number }[]) => [
        group[0].a,
        group[0].b,
      ]),
    ).toEqual([
      ["x", 1],
      ["x", 2],
      ["y", 1],
      ["y", 3],
    ]);
    expect(result[0].map((row: { v: number }) => row.v)).toEqual([1, 4]);
  });

  test("深さ3: 入れ子の平坦化後も各グループは行配列", () => {
    const rows = [
      { a: 1, b: 1, c: 1 },
      { a: 1, b: 1, c: 2 },
      { a: 1, b: 2, c: 1 },
      { a: 2, b: 1, c: 1 },
    ];

    const result = byClassification(rows, ["a", "b", "c"]);

    expect(result).toHaveLength(4);
    expect(
      result.every(
        (group: unknown[]) =>
          Array.isArray(group) &&
          group.length === 1 &&
          !Array.isArray(group[0]),
      ),
    ).toBe(true);
  });

  test("深さ2: 同時刻・別インスタンスの Date キーは同一グループ", () => {
    const rows = [
      { at: new Date("2026-07-18T09:30:00.000Z"), city: "Tokyo", v: 1 },
      { at: new Date("2026-07-18T09:30:00.000Z"), city: "Tokyo", v: 2 },
      { at: new Date("2026-07-18T09:31:00.000Z"), city: "Tokyo", v: 3 },
    ];

    const result = byClassification(rows, ["at", "city"]);

    expect(result).toHaveLength(2);
    expect(result[0]).toHaveLength(2);
  });
});
