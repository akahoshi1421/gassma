import { createSheetReadCache } from "../../../util/read/cachedSheetReader";
import type { SheetReader } from "../../../util/read/sheetReader";
import type { SheetWriter } from "../../../util/write/sheetWriter";

const makeBaseReader = (
  rangeValues?: (
    sheet: any,
    rowNumber: number,
    columnNumber: number,
    rowLength: number,
    columnLength: number,
  ) => any[][],
) => {
  const getLastRow = jest.fn((sheet: any) => sheet.lastRow ?? 5);
  const getRangeValues = jest.fn(
    rangeValues ??
      ((_sheet: any, r: number, c: number, rl: number, cl: number) => [
        [`${r},${c},${rl},${cl}`],
      ]),
  );
  const reader: SheetReader = { getLastRow, getRangeValues };
  return { reader, getLastRow, getRangeValues };
};

const makeBaseWriter = () => {
  const appendRows = jest.fn();
  const updateRow = jest.fn();
  const updateRows = jest.fn();
  const deleteRow = jest.fn();
  const deleteRows = jest.fn();
  const writer: SheetWriter = {
    appendRows,
    updateRow,
    updateRows,
    deleteRow,
    deleteRows,
  };
  return { writer, appendRows, updateRow, deleteRow };
};

describe("createSheetReadCache の reader ラップ", () => {
  test("getLastRow は同一シートなら base を1回しか呼ばない", () => {
    const sheetA: any = { lastRow: 7 };
    const base = makeBaseReader();
    const cached = createSheetReadCache().wrapReader(base.reader);

    expect(cached.getLastRow(sheetA)).toBe(7);
    expect(cached.getLastRow(sheetA)).toBe(7);
    expect(base.getLastRow).toHaveBeenCalledTimes(1);
  });

  test("getLastRow はシートごとに別々にキャッシュする", () => {
    const sheetA: any = { lastRow: 7 };
    const sheetB: any = { lastRow: 3 };
    const base = makeBaseReader();
    const cached = createSheetReadCache().wrapReader(base.reader);

    expect(cached.getLastRow(sheetA)).toBe(7);
    expect(cached.getLastRow(sheetB)).toBe(3);
    expect(cached.getLastRow(sheetA)).toBe(7);
    expect(base.getLastRow).toHaveBeenCalledTimes(2);
  });

  test("getLastRow が 0 でもキャッシュされる", () => {
    const sheetA: any = { lastRow: 0 };
    const base = makeBaseReader();
    const cached = createSheetReadCache().wrapReader(base.reader);

    expect(cached.getLastRow(sheetA)).toBe(0);
    expect(cached.getLastRow(sheetA)).toBe(0);
    expect(base.getLastRow).toHaveBeenCalledTimes(1);
  });

  test("getRangeValues は同一シート・同一引数なら base を1回しか呼ばない", () => {
    const sheetA: any = {};
    const base = makeBaseReader();
    const cached = createSheetReadCache().wrapReader(base.reader);

    expect(cached.getRangeValues(sheetA, 1, 1, 1, 3)).toEqual([["1,1,1,3"]]);
    expect(cached.getRangeValues(sheetA, 1, 1, 1, 3)).toEqual([["1,1,1,3"]]);
    expect(base.getRangeValues).toHaveBeenCalledTimes(1);
  });

  test("getRangeValues は範囲引数が違えば別々に読む", () => {
    const sheetA: any = {};
    const base = makeBaseReader();
    const cached = createSheetReadCache().wrapReader(base.reader);

    expect(cached.getRangeValues(sheetA, 1, 1, 1, 3)).toEqual([["1,1,1,3"]]);
    expect(cached.getRangeValues(sheetA, 2, 1, 4, 3)).toEqual([["2,1,4,3"]]);
    expect(base.getRangeValues).toHaveBeenCalledTimes(2);
  });

  test("getRangeValues はシートが違えば同一引数でも別々に読む", () => {
    const sheetA: any = {};
    const sheetB: any = {};
    const base = makeBaseReader();
    const cached = createSheetReadCache().wrapReader(base.reader);

    cached.getRangeValues(sheetA, 1, 1, 1, 3);
    cached.getRangeValues(sheetB, 1, 1, 1, 3);
    expect(base.getRangeValues).toHaveBeenCalledTimes(2);
  });

  test("初回は base が返した配列をそのまま返す", () => {
    const sheetA: any = {};
    const original = [["id", "name"]];
    const base = makeBaseReader(() => original);
    const cached = createSheetReadCache().wrapReader(base.reader);

    expect(cached.getRangeValues(sheetA, 1, 1, 1, 2)).toBe(original);
  });

  test("ヒット時は等価な値を返すが配列インスタンスは毎回新しい", () => {
    const sheetA: any = {};
    const base = makeBaseReader(() => [
      [1, "Alice"],
      [2, "Bob"],
    ]);
    const cached = createSheetReadCache().wrapReader(base.reader);

    const first = cached.getRangeValues(sheetA, 2, 1, 2, 2);
    const second = cached.getRangeValues(sheetA, 2, 1, 2, 2);
    const third = cached.getRangeValues(sheetA, 2, 1, 2, 2);

    expect(second).toEqual(first);
    expect(third).toEqual(first);
    expect(second).not.toBe(first);
    expect(third).not.toBe(second);
    expect(second[0]).not.toBe(first[0]);
    expect(third[0]).not.toBe(second[0]);
  });

  test("Date セルはヒットごとに新しいインスタンスで同時刻", () => {
    const sheetA: any = {};
    const fixedDate = new Date("2026-01-02T03:04:05Z");
    const base = makeBaseReader(() => [[fixedDate]]);
    const cached = createSheetReadCache().wrapReader(base.reader);

    const first = cached.getRangeValues(sheetA, 2, 1, 1, 1);
    const second = cached.getRangeValues(sheetA, 2, 1, 1, 1);
    const third = cached.getRangeValues(sheetA, 2, 1, 1, 1);

    expect(first[0][0]).toBe(fixedDate);
    expect(second[0][0]).not.toBe(fixedDate);
    expect(third[0][0]).not.toBe(second[0][0]);
    expect(second[0][0].getTime()).toBe(fixedDate.getTime());
    expect(third[0][0].getTime()).toBe(fixedDate.getTime());
  });

  test("初回呼び出し側が返り値を書き換えてもスナップショットは汚れない", () => {
    const sheetA: any = {};
    const original = [[1, "Alice"]];
    const base = makeBaseReader(() => original);
    const cached = createSheetReadCache().wrapReader(base.reader);

    const first = cached.getRangeValues(sheetA, 2, 1, 1, 2);
    first[0][1] = "hacked";

    expect(cached.getRangeValues(sheetA, 2, 1, 1, 2)).toEqual([[1, "Alice"]]);
  });
});

describe("createSheetReadCache の clear", () => {
  test("clear で全シートのキャッシュが破棄される", () => {
    const sheetA: any = { lastRow: 7 };
    const sheetB: any = { lastRow: 3 };
    const base = makeBaseReader();
    const cache = createSheetReadCache();
    const reader = cache.wrapReader(base.reader);

    reader.getLastRow(sheetA);
    reader.getRangeValues(sheetB, 1, 1, 1, 3);
    cache.clear();
    reader.getLastRow(sheetA);
    reader.getRangeValues(sheetB, 1, 1, 1, 3);

    expect(base.getLastRow).toHaveBeenCalledTimes(2);
    expect(base.getRangeValues).toHaveBeenCalledTimes(2);
  });
});

describe("createSheetReadCache の writer ラップ(安全網)", () => {
  test("appendRows は base に委譲しつつ全キャッシュを破棄する", () => {
    const sheetA: any = { lastRow: 7 };
    const sheetB: any = { lastRow: 3 };
    const baseReader = makeBaseReader();
    const baseWriter = makeBaseWriter();
    const cache = createSheetReadCache();
    const reader = cache.wrapReader(baseReader.reader);
    const writer = cache.wrapWriter(baseWriter.writer);

    reader.getLastRow(sheetA);
    reader.getLastRow(sheetB);
    reader.getRangeValues(sheetA, 1, 1, 1, 3);
    expect(baseReader.getLastRow).toHaveBeenCalledTimes(2);
    expect(baseReader.getRangeValues).toHaveBeenCalledTimes(1);

    writer.appendRows(sheetA, 1, 3, [[3, "Carol", 40]]);
    expect(baseWriter.appendRows).toHaveBeenCalledWith(sheetA, 1, 3, [
      [3, "Carol", 40],
    ]);

    reader.getLastRow(sheetA);
    reader.getLastRow(sheetB);
    reader.getRangeValues(sheetA, 1, 1, 1, 3);
    expect(baseReader.getLastRow).toHaveBeenCalledTimes(4);
    expect(baseReader.getRangeValues).toHaveBeenCalledTimes(2);
  });

  test("updateRow / updateRows / deleteRow / deleteRows も破棄と委譲を行う", () => {
    const sheetA: any = { lastRow: 7 };
    const baseReader = makeBaseReader();
    const baseWriter = makeBaseWriter();
    const cache = createSheetReadCache();
    const reader = cache.wrapReader(baseReader.reader);
    const writer = cache.wrapWriter(baseWriter.writer);

    reader.getLastRow(sheetA);
    writer.updateRow(sheetA, 2, 1, 3, [1, "Alice", 21]);
    expect(baseWriter.updateRow).toHaveBeenCalledWith(sheetA, 2, 1, 3, [
      1,
      "Alice",
      21,
    ]);
    reader.getLastRow(sheetA);
    expect(baseReader.getLastRow).toHaveBeenCalledTimes(2);

    writer.updateRows(sheetA, 2, 1, 3, [[1, "Alice", 22]]);
    reader.getLastRow(sheetA);
    expect(baseReader.getLastRow).toHaveBeenCalledTimes(3);

    writer.deleteRow(sheetA, 2);
    reader.getLastRow(sheetA);
    expect(baseReader.getLastRow).toHaveBeenCalledTimes(4);

    writer.deleteRows(sheetA, 2, 1);
    reader.getLastRow(sheetA);
    expect(baseReader.getLastRow).toHaveBeenCalledTimes(5);
  });
});
