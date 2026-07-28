import { deleteManyFunc } from "../../../util/delete/deleteMany";
import { updateManyFunc } from "../../../util/update/updateMany";
import type { SheetWriter } from "../../../util/write/sheetWriter";
import { getMutableMockControllerUtil } from "../../consts/mockControllerUtil";

type WriterCall = { method: string; args: unknown[] };

const createCountingWriter = (): {
  writer: SheetWriter;
  calls: WriterCall[];
} => {
  const calls: WriterCall[] = [];
  const writer: SheetWriter = {
    appendRows: (_sheet, startColumnNumber, columnLength, rows) => {
      calls.push({
        method: "appendRows",
        args: [startColumnNumber, columnLength, rows],
      });
    },
    updateRow: (_sheet, rowNumber, startColumnNumber, columnLength, row) => {
      calls.push({
        method: "updateRow",
        args: [rowNumber, startColumnNumber, columnLength, row],
      });
    },
    updateRows: (
      _sheet,
      startRowNumber,
      startColumnNumber,
      columnLength,
      rows,
    ) => {
      calls.push({
        method: "updateRows",
        args: [startRowNumber, startColumnNumber, columnLength, rows],
      });
    },
    deleteRow: (_sheet, rowNumber) => {
      calls.push({ method: "deleteRow", args: [rowNumber] });
    },
    deleteRows: (_sheet, rowPosition, howMany) => {
      calls.push({ method: "deleteRows", args: [rowPosition, howMany] });
    },
  };
  return { writer, calls };
};

const buildUtil = () => {
  const util = getMutableMockControllerUtil();
  const { writer, calls } = createCountingWriter();
  util.writer = writer;
  return { util, calls };
};

describe("updateManyFunc の書き込みコール束ね", () => {
  test("連続 3 行のマッチは 1 回の updateRows にまとまる", () => {
    const { util, calls } = buildUtil();

    const result = updateManyFunc(util, {
      where: { OR: [{ 名前: "Alice" }, { 名前: "Bob" }, { 名前: "Charlie" }] },
      data: { 職業: "Updated" },
    });

    expect(result).toEqual({ count: 3 });
    expect(calls).toEqual([
      {
        method: "updateRows",
        args: [
          2,
          1,
          5,
          [
            ["Alice", 28, "Tokyo", "100-0001", "Updated"],
            ["Bob", 35, "Osaka", "550-0001", "Updated"],
            ["Charlie", 22, "Tokyo", "100-0002", "Updated"],
          ],
        ],
      },
    ]);
  });

  test("全行マッチ(連続 8 行)は 1 回の updateRows にまとまる", () => {
    const { util, calls } = buildUtil();

    const result = updateManyFunc(util, { data: { 職業: "Updated" } });

    expect(result).toEqual({ count: 8 });
    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe("updateRows");
    expect(calls[0].args[0]).toBe(2);
    expect(calls[0].args[3]).toHaveLength(8);
  });

  test("1 行おきの散在マッチは行数ぶんの updateRow になる", () => {
    const { util, calls } = buildUtil();

    const result = updateManyFunc(util, {
      where: { 住所: "Tokyo" },
      data: { 郵便番号: "999-9999" },
    });

    expect(result).toEqual({ count: 4 });
    expect(calls).toEqual([
      {
        method: "updateRow",
        args: [2, 1, 5, ["Alice", 28, "Tokyo", "999-9999", "Engineer"]],
      },
      {
        method: "updateRow",
        args: [4, 1, 5, ["Charlie", 22, "Tokyo", "999-9999", "Student"]],
      },
      {
        method: "updateRow",
        args: [6, 1, 5, ["Eve", 28, "Tokyo", "999-9999", "Engineer"]],
      },
      {
        method: "updateRow",
        args: [8, 1, 5, ["Grace", 31, "Tokyo", "999-9999", "Designer"]],
      },
    ]);
  });

  test("連続 2 ブロックのマッチは 2 回の updateRows になる", () => {
    const { util, calls } = buildUtil();

    const result = updateManyFunc(util, {
      where: {
        OR: [
          { 名前: "Alice" },
          { 名前: "Bob" },
          { 名前: "Eve" },
          { 名前: "Frank" },
        ],
      },
      data: { 職業: "Updated" },
    });

    expect(result).toEqual({ count: 4 });
    expect(calls).toEqual([
      {
        method: "updateRows",
        args: [
          2,
          1,
          5,
          [
            ["Alice", 28, "Tokyo", "100-0001", "Updated"],
            ["Bob", 35, "Osaka", "550-0001", "Updated"],
          ],
        ],
      },
      {
        method: "updateRows",
        args: [
          6,
          1,
          5,
          [
            ["Eve", 28, "Tokyo", "100-0003", "Updated"],
            ["Frank", 52, "Osaka", "550-0002", "Updated"],
          ],
        ],
      },
    ]);
  });

  test("単一行マッチは従来どおり 1 回の updateRow になる", () => {
    const { util, calls } = buildUtil();

    const result = updateManyFunc(util, {
      where: { 名前: "David" },
      data: { 職業: "Updated" },
    });

    expect(result).toEqual({ count: 1 });
    expect(calls).toEqual([
      {
        method: "updateRow",
        args: [5, 1, 5, ["David", 45, "Kyoto", "600-8000", "Updated"]],
      },
    ]);
  });

  test("マッチ 0 件では書き込みコールしない", () => {
    const { util, calls } = buildUtil();

    const result = updateManyFunc(util, {
      where: { 名前: "Nobody" },
      data: { 職業: "Updated" },
    });

    expect(result).toEqual({ count: 0 });
    expect(calls).toEqual([]);
  });

  test("limit 適用後の連続行も 1 回の updateRows にまとまる", () => {
    const { util, calls } = buildUtil();

    const result = updateManyFunc(util, {
      where: { OR: [{ 名前: "Alice" }, { 名前: "Bob" }, { 名前: "Charlie" }] },
      data: { 職業: "Updated" },
      limit: 2,
    });

    expect(result).toEqual({ count: 2 });
    expect(calls).toEqual([
      {
        method: "updateRows",
        args: [
          2,
          1,
          5,
          [
            ["Alice", 28, "Tokyo", "100-0001", "Updated"],
            ["Bob", 35, "Osaka", "550-0001", "Updated"],
          ],
        ],
      },
    ]);
  });

  test("increment は行ごとの既存値から個別計算され 2D 配列に行別の結果が積まれる", () => {
    const { util, calls } = buildUtil();

    const result = updateManyFunc(util, {
      where: { OR: [{ 名前: "Alice" }, { 名前: "Bob" }, { 名前: "Charlie" }] },
      data: { 年齢: { increment: 5 } },
    });

    expect(result).toEqual({ count: 3 });
    expect(calls).toEqual([
      {
        method: "updateRows",
        args: [
          2,
          1,
          5,
          [
            ["Alice", 33, "Tokyo", "100-0001", "Engineer"],
            ["Bob", 40, "Osaka", "550-0001", "Designer"],
            ["Charlie", 27, "Tokyo", "100-0002", "Student"],
          ],
        ],
      },
    ]);
  });

  test("更新対象が一部列のみでも各行の非対象セルがその行の値のまま保存される", () => {
    const { util, calls } = buildUtil();

    updateManyFunc(util, {
      where: { OR: [{ 名前: "Alice" }, { 名前: "Bob" }, { 名前: "Charlie" }] },
      data: { 郵便番号: "000-0000" },
    });

    expect(calls).toEqual([
      {
        method: "updateRows",
        args: [
          2,
          1,
          5,
          [
            ["Alice", 28, "Tokyo", "000-0000", "Engineer"],
            ["Bob", 35, "Osaka", "000-0000", "Designer"],
            ["Charlie", 22, "Tokyo", "000-0000", "Student"],
          ],
        ],
      },
    ]);
  });

  test("記述式エスケープは各行に適用され、返り値レコードは元の値を保つ", () => {
    const { util, calls } = buildUtil();

    const records = updateManyFunc(
      util,
      {
        where: { OR: [{ 名前: "Alice" }, { 名前: "Bob" }] },
        data: { 住所: "=SUM(A1)" },
      },
      true,
    );

    expect(calls).toEqual([
      {
        method: "updateRows",
        args: [
          2,
          1,
          5,
          [
            ["Alice", 28, "'=SUM(A1)", "100-0001", "Engineer"],
            ["Bob", 35, "'=SUM(A1)", "550-0001", "Designer"],
          ],
        ],
      },
    ]);
    expect(records.map((record) => record["住所"])).toEqual([
      "=SUM(A1)",
      "=SUM(A1)",
    ]);
  });

  test("返り値レコードは書き込みを束ねても findedData の元順と内容を維持する", () => {
    const { util, calls } = buildUtil();

    const records = updateManyFunc(
      util,
      {
        where: { OR: [{ 名前: "Frank" }, { 名前: "Alice" }] },
        data: { 職業: "Updated" },
      },
      true,
    );

    expect(records).toEqual([
      {
        名前: "Frank",
        年齢: 52,
        住所: "Osaka",
        郵便番号: "550-0002",
        職業: "Updated",
      },
      {
        名前: "Alice",
        年齢: 28,
        住所: "Tokyo",
        郵便番号: "100-0001",
        職業: "Updated",
      },
    ]);
    expect(calls).toEqual([
      {
        method: "updateRow",
        args: [2, 1, 5, ["Alice", 28, "Tokyo", "100-0001", "Updated"]],
      },
      {
        method: "updateRow",
        args: [7, 1, 5, ["Frank", 52, "Osaka", "550-0002", "Updated"]],
      },
    ]);
  });

  test("空行スキップはランを分断し、前後の行を詰めて書かない", () => {
    const { util, calls } = buildUtil();
    const whereFilterSpy = jest.spyOn(
      require("../../../util/core/whereFilter"),
      "whereFilter",
    );
    whereFilterSpy.mockReturnValueOnce([
      { rowNumber: 1, row: ["Alice", 28, "Tokyo", "100-0001", "Engineer"] },
      { rowNumber: 2, row: [] },
      { rowNumber: 3, row: ["Charlie", 22, "Tokyo", "100-0002", "Student"] },
    ]);

    const result = updateManyFunc(util, {
      where: { 名前: "unused" },
      data: { 職業: "Updated" },
    });

    expect(result).toEqual({ count: 3 });
    expect(calls).toEqual([
      {
        method: "updateRow",
        args: [2, 1, 5, ["Alice", 28, "Tokyo", "100-0001", "Updated"]],
      },
      {
        method: "updateRow",
        args: [4, 1, 5, ["Charlie", 22, "Tokyo", "100-0002", "Updated"]],
      },
    ]);
    whereFilterSpy.mockRestore();
  });
});

describe("deleteManyFunc の削除コール束ね", () => {
  test("連続 3 行のマッチは 1 回の deleteRows にまとまる", () => {
    const { util, calls } = buildUtil();

    const result = deleteManyFunc(util, {
      where: { OR: [{ 名前: "Alice" }, { 名前: "Bob" }, { 名前: "Charlie" }] },
    });

    expect(result).toEqual({ count: 3 });
    expect(calls).toEqual([{ method: "deleteRows", args: [2, 3] }]);
  });

  test("全行マッチ(連続 8 行)は 1 回の deleteRows にまとまる", () => {
    const { util, calls } = buildUtil();

    const result = deleteManyFunc(util, { where: {} });

    expect(result).toEqual({ count: 8 });
    expect(calls).toEqual([{ method: "deleteRows", args: [2, 8] }]);
  });

  test("1 行おきの散在マッチは行数ぶんの deleteRow を降順で呼ぶ", () => {
    const { util, calls } = buildUtil();

    const result = deleteManyFunc(util, { where: { 住所: "Tokyo" } });

    expect(result).toEqual({ count: 4 });
    expect(calls).toEqual([
      { method: "deleteRow", args: [8] },
      { method: "deleteRow", args: [6] },
      { method: "deleteRow", args: [4] },
      { method: "deleteRow", args: [2] },
    ]);
  });

  test("連続 2 ブロックのマッチはブロックごとの deleteRows を降順で呼ぶ", () => {
    const { util, calls } = buildUtil();

    const result = deleteManyFunc(util, {
      where: {
        OR: [
          { 名前: "Alice" },
          { 名前: "Bob" },
          { 名前: "Eve" },
          { 名前: "Frank" },
        ],
      },
    });

    expect(result).toEqual({ count: 4 });
    expect(calls).toEqual([
      { method: "deleteRows", args: [6, 2] },
      { method: "deleteRows", args: [2, 2] },
    ]);
  });

  test("ブロックと単一行の混在は降順のまま束ねる", () => {
    const { util, calls } = buildUtil();

    const result = deleteManyFunc(util, {
      where: {
        OR: [
          { 名前: "Alice" },
          { 名前: "Bob" },
          { 名前: "Charlie" },
          { 名前: "Frank" },
        ],
      },
    });

    expect(result).toEqual({ count: 4 });
    expect(calls).toEqual([
      { method: "deleteRow", args: [7] },
      { method: "deleteRows", args: [2, 3] },
    ]);
  });

  test("単一行マッチは従来どおり 1 回の deleteRow になる", () => {
    const { util, calls } = buildUtil();

    const result = deleteManyFunc(util, { where: { 名前: "David" } });

    expect(result).toEqual({ count: 1 });
    expect(calls).toEqual([{ method: "deleteRow", args: [5] }]);
  });

  test("マッチ 0 件では削除コールしない", () => {
    const { util, calls } = buildUtil();

    const result = deleteManyFunc(util, { where: { 名前: "Nobody" } });

    expect(result).toEqual({ count: 0 });
    expect(calls).toEqual([]);
  });

  test("limit 適用後の連続行も 1 回の deleteRows にまとまる", () => {
    const { util, calls } = buildUtil();

    const result = deleteManyFunc(util, {
      where: { OR: [{ 名前: "Alice" }, { 名前: "Bob" }, { 名前: "Charlie" }] },
      limit: 2,
    });

    expect(result).toEqual({ count: 2 });
    expect(calls).toEqual([{ method: "deleteRows", args: [2, 2] }]);
  });
});
