import {
  groupDeleteBlocksDescending,
  groupUpdateRuns,
} from "../../../util/write/rowRuns";

describe("groupUpdateRuns", () => {
  test("連続する行番号は 1 ランにまとまり、行ごとの値が行順で 2D 配列になる", () => {
    const runs = groupUpdateRuns([
      { rowNumber: 2, row: ["a", 1] },
      { rowNumber: 3, row: ["b", 2] },
      { rowNumber: 4, row: ["c", 3] },
    ]);

    expect(runs).toEqual([
      {
        startRowNumber: 2,
        rows: [
          ["a", 1],
          ["b", 2],
          ["c", 3],
        ],
      },
    ]);
  });

  test("1 行おきの行はそれぞれ別ランになる", () => {
    const runs = groupUpdateRuns([
      { rowNumber: 2, row: ["a"] },
      { rowNumber: 4, row: ["b"] },
      { rowNumber: 6, row: ["c"] },
    ]);

    expect(runs).toEqual([
      { startRowNumber: 2, rows: [["a"]] },
      { startRowNumber: 4, rows: [["b"]] },
      { startRowNumber: 6, rows: [["c"]] },
    ]);
  });

  test("連続ブロックが 2 つあれば 2 ランになる", () => {
    const runs = groupUpdateRuns([
      { rowNumber: 2, row: ["a"] },
      { rowNumber: 3, row: ["b"] },
      { rowNumber: 6, row: ["c"] },
      { rowNumber: 7, row: ["d"] },
    ]);

    expect(runs).toEqual([
      { startRowNumber: 2, rows: [["a"], ["b"]] },
      { startRowNumber: 6, rows: [["c"], ["d"]] },
    ]);
  });

  test("入力順が乱れていても行番号昇順に並べてまとめる", () => {
    const runs = groupUpdateRuns([
      { rowNumber: 4, row: ["c"] },
      { rowNumber: 2, row: ["a"] },
      { rowNumber: 3, row: ["b"] },
    ]);

    expect(runs).toEqual([{ startRowNumber: 2, rows: [["a"], ["b"], ["c"]] }]);
  });

  test("入力の並びは破壊しない", () => {
    const entries = [
      { rowNumber: 4, row: ["c"] },
      { rowNumber: 2, row: ["a"] },
    ];

    groupUpdateRuns(entries);

    expect(entries.map((entry) => entry.rowNumber)).toEqual([4, 2]);
  });

  test("単一行は 1 ランになる", () => {
    expect(groupUpdateRuns([{ rowNumber: 5, row: ["a"] }])).toEqual([
      { startRowNumber: 5, rows: [["a"]] },
    ]);
  });

  test("空入力は空配列を返す", () => {
    expect(groupUpdateRuns([])).toEqual([]);
  });
});

describe("groupDeleteBlocksDescending", () => {
  test("連続行は先頭行番号と行数の 1 ブロックにまとまる", () => {
    expect(groupDeleteBlocksDescending([2, 3, 4])).toEqual([
      { rowPosition: 2, howMany: 3 },
    ]);
  });

  test("ブロックは行番号降順に並ぶ", () => {
    expect(groupDeleteBlocksDescending([2, 3, 7, 8])).toEqual([
      { rowPosition: 7, howMany: 2 },
      { rowPosition: 2, howMany: 2 },
    ]);
  });

  test("散在行は各 1 行ブロックとして降順に並ぶ", () => {
    expect(groupDeleteBlocksDescending([2, 4, 6])).toEqual([
      { rowPosition: 6, howMany: 1 },
      { rowPosition: 4, howMany: 1 },
      { rowPosition: 2, howMany: 1 },
    ]);
  });

  test("入力順が乱れていても降順にブロック化する", () => {
    expect(groupDeleteBlocksDescending([8, 2, 7, 3])).toEqual([
      { rowPosition: 7, howMany: 2 },
      { rowPosition: 2, howMany: 2 },
    ]);
  });

  test("入力の並びは破壊しない", () => {
    const rowNumbers = [8, 2, 7, 3];

    groupDeleteBlocksDescending(rowNumbers);

    expect(rowNumbers).toEqual([8, 2, 7, 3]);
  });

  test("単一行は 1 行ブロックになる", () => {
    expect(groupDeleteBlocksDescending([5])).toEqual([
      { rowPosition: 5, howMany: 1 },
    ]);
  });

  test("空入力は空配列を返す", () => {
    expect(groupDeleteBlocksDescending([])).toEqual([]);
  });
});
