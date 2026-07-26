import { getAllData } from "../../../util/core/getAllData";
import { getTitle } from "../../../util/core/getTitle";
import { createTransactionBuffer } from "../../../util/transaction/transactionBuffer";
import type { GassmaControllerUtil } from "../../../types/gassmaControllerUtilType";
import { makeLoggedSheet } from "./transactionTestClient";

const initialUsers = [
  ["id", "name", "age"],
  [1, "Alice", 20],
  [2, "Bob", 30],
];

describe("createTransactionBuffer の書き込みバッファ", () => {
  test("appendRows は実シートに書かずバッファされる", () => {
    const { sheet, snapshot, writes } = makeLoggedSheet("Users", initialUsers);
    const buffer = createTransactionBuffer();

    buffer.writer.appendRows(sheet, 1, 3, [[3, "Carol", 40]]);

    expect(writes).toEqual([]);
    expect(snapshot()).toEqual(initialUsers);
  });

  test("updateRow / deleteRow も実シートに書かない", () => {
    const { sheet, snapshot, writes } = makeLoggedSheet("Users", initialUsers);
    const buffer = createTransactionBuffer();

    buffer.writer.updateRow(sheet, 2, 1, 3, [1, "Alice", 21]);
    buffer.writer.deleteRow(sheet, 3);

    expect(writes).toEqual([]);
    expect(snapshot()).toEqual(initialUsers);
  });
});

describe("createTransactionBuffer の読み取りオーバーレイ", () => {
  test("append した行が読み取りに見える", () => {
    const { sheet } = makeLoggedSheet("Users", initialUsers);
    const buffer = createTransactionBuffer();

    buffer.writer.appendRows(sheet, 1, 3, [[3, "Carol", 40]]);

    expect(buffer.reader.getLastRow(sheet)).toBe(4);
    expect(buffer.reader.getRangeValues(sheet, 4, 1, 1, 3)).toEqual([
      [3, "Carol", 40],
    ]);
  });

  test("updateRow の変更が読み取りに見える", () => {
    const { sheet } = makeLoggedSheet("Users", initialUsers);
    const buffer = createTransactionBuffer();

    buffer.writer.updateRow(sheet, 2, 1, 3, [1, "Alice", 21]);

    expect(buffer.reader.getRangeValues(sheet, 2, 1, 1, 3)).toEqual([
      [1, "Alice", 21],
    ]);
  });

  test("deleteRow で行が詰まる", () => {
    const { sheet } = makeLoggedSheet("Users", initialUsers);
    const buffer = createTransactionBuffer();

    buffer.writer.deleteRow(sheet, 2);

    expect(buffer.reader.getLastRow(sheet)).toBe(2);
    expect(buffer.reader.getRangeValues(sheet, 2, 1, 1, 3)).toEqual([
      [2, "Bob", 30],
    ]);
  });

  test("スナップショット後の実シート変更は tx 内読み取りに影響しない", () => {
    const { sheet } = makeLoggedSheet("Users", initialUsers);
    const buffer = createTransactionBuffer();

    expect(buffer.reader.getLastRow(sheet)).toBe(3);
    sheet.getRange(2, 3, 1, 1).setValues([[99]]);

    expect(buffer.reader.getRangeValues(sheet, 2, 1, 1, 3)).toEqual([
      [1, "Alice", 20],
    ]);
  });
});

describe("flush の発行順再生", () => {
  test("append→update→delete→append の交錯を発行順に再生する", () => {
    const { sheet, snapshot, writes } = makeLoggedSheet("Users", initialUsers);
    const buffer = createTransactionBuffer();

    buffer.writer.appendRows(sheet, 1, 3, [[3, "Carol", 40]]);
    buffer.writer.updateRow(sheet, 2, 1, 3, [1, "Alice", 21]);
    buffer.writer.deleteRow(sheet, 3);
    buffer.writer.appendRows(sheet, 1, 3, [[4, "Dave", 50]]);

    expect(writes).toEqual([]);
    buffer.flush();

    expect(writes).toEqual([
      { method: "setValues", args: [4, 1, [[3, "Carol", 40]]] },
      { method: "setValues", args: [2, 1, [[1, "Alice", 21]]] },
      { method: "deleteRow", args: [3] },
      { method: "setValues", args: [4, 1, [[4, "Dave", 50]]] },
    ]);
    expect(snapshot()).toEqual([
      ["id", "name", "age"],
      [1, "Alice", 21],
      [3, "Carol", 40],
      [4, "Dave", 50],
    ]);
  });

  test("降順 deleteRow の順序が保存される", () => {
    const { sheet, snapshot, writes } = makeLoggedSheet("Users", initialUsers);
    const buffer = createTransactionBuffer();

    buffer.writer.deleteRow(sheet, 3);
    buffer.writer.deleteRow(sheet, 2);
    buffer.flush();

    expect(writes).toEqual([
      { method: "deleteRow", args: [3] },
      { method: "deleteRow", args: [2] },
    ]);
    expect(snapshot()).toEqual([["id", "name", "age"]]);
  });
});

describe("getAllData / getTitle のオーバーレイ経由読み取り", () => {
  const buildUtil = (
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    reader: GassmaControllerUtil["reader"],
  ): GassmaControllerUtil => ({
    sheet,
    startRowNumber: 1,
    startColumnNumber: 1,
    endColumnNumber: 3,
    reader,
  });

  test("getAllData は積んだ append を含み、空文字は null になる", () => {
    const { sheet } = makeLoggedSheet("Users", initialUsers);
    const buffer = createTransactionBuffer();

    buffer.writer.appendRows(sheet, 1, 3, [[3, "Carol", ""]]);

    expect(getAllData(buildUtil(sheet, buffer.reader))).toEqual([
      [1, "Alice", 20],
      [2, "Bob", 30],
      [3, "Carol", null],
    ]);
  });

  test("getTitle はスナップショットからヘッダを返す", () => {
    const { sheet } = makeLoggedSheet("Users", initialUsers);
    const buffer = createTransactionBuffer();

    expect(getTitle(buildUtil(sheet, buffer.reader))).toEqual([
      "id",
      "name",
      "age",
    ]);
  });

  test("reader 未指定なら従来どおり実シートを読む", () => {
    const { sheet } = makeLoggedSheet("Users", initialUsers);

    expect(getAllData(buildUtil(sheet, undefined))).toEqual([
      [1, "Alice", 20],
      [2, "Bob", 30],
    ]);
  });
});
