import { createFunc } from "../../../util/create/create";
import { createManyFunc } from "../../../util/create/createManyFunc";
import { deleteManyFunc } from "../../../util/delete/deleteMany";
import { resolveNestedUpdate } from "../../../util/update/nestedWrite/resolveNestedUpdate";
import { updateManyFunc } from "../../../util/update/updateMany";
import type { SheetWriter } from "../../../util/write/sheetWriter";
import {
  immediateSheetWriter,
  resolveWriter,
} from "../../../util/write/sheetWriter";
import { getMutableMockControllerUtil } from "../../consts/mockControllerUtil";

type WriterCall = { method: string; args: unknown[] };

const createFakeWriter = (): { writer: SheetWriter; calls: WriterCall[] } => {
  const calls: WriterCall[] = [];
  const writer: SheetWriter = {
    appendRows: (sheet, startColumnNumber, columnLength, rows) => {
      calls.push({
        method: "appendRows",
        args: [sheet, startColumnNumber, columnLength, rows],
      });
    },
    updateRow: (sheet, rowNumber, startColumnNumber, columnLength, row) => {
      calls.push({
        method: "updateRow",
        args: [sheet, rowNumber, startColumnNumber, columnLength, row],
      });
    },
    updateRows: (
      sheet,
      startRowNumber,
      startColumnNumber,
      columnLength,
      rows,
    ) => {
      calls.push({
        method: "updateRows",
        args: [sheet, startRowNumber, startColumnNumber, columnLength, rows],
      });
    },
    deleteRow: (sheet, rowNumber) => {
      calls.push({ method: "deleteRow", args: [sheet, rowNumber] });
    },
    deleteRows: (sheet, rowPosition, howMany) => {
      calls.push({ method: "deleteRows", args: [sheet, rowPosition, howMany] });
    },
  };
  return { writer, calls };
};

const createSpySheet = () => {
  const setValues = jest.fn();
  const getRange = jest.fn(() => ({ setValues }));
  const sheet = {
    getLastRow: jest.fn(() => 9),
    getRange,
    deleteRow: jest.fn(),
    deleteRows: jest.fn(),
  } as any;
  return { sheet, getRange, setValues };
};

describe("immediateSheetWriter", () => {
  test("appendRows は getLastRow()+1 の位置に setValues する", () => {
    const { sheet, getRange, setValues } = createSpySheet();
    const rows = [
      ["a", 1],
      ["b", 2],
    ];

    immediateSheetWriter.appendRows(sheet, 3, 2, rows);

    expect(sheet.getLastRow).toHaveBeenCalledTimes(1);
    expect(getRange).toHaveBeenCalledWith(10, 3, 2, 2);
    expect(setValues).toHaveBeenCalledWith(rows);
  });

  test("updateRow は指定行の範囲に setValues する", () => {
    const { sheet, getRange, setValues } = createSpySheet();
    const row = ["a", 1, "x"];

    immediateSheetWriter.updateRow(sheet, 5, 2, 3, row);

    expect(getRange).toHaveBeenCalledWith(5, 2, 1, 3);
    expect(setValues).toHaveBeenCalledWith([row]);
    expect(sheet.getLastRow).not.toHaveBeenCalled();
  });

  test("deleteRow は sheet.deleteRow を呼ぶ", () => {
    const { sheet, getRange } = createSpySheet();

    immediateSheetWriter.deleteRow(sheet, 7);

    expect(sheet.deleteRow).toHaveBeenCalledWith(7);
    expect(getRange).not.toHaveBeenCalled();
  });

  test("updateRows は連続行の範囲に 1 回の setValues で書く", () => {
    const { sheet, getRange, setValues } = createSpySheet();
    const rows = [
      ["a", 1, "x"],
      ["b", 2, "y"],
    ];

    immediateSheetWriter.updateRows(sheet, 5, 2, 3, rows);

    expect(getRange).toHaveBeenCalledTimes(1);
    expect(getRange).toHaveBeenCalledWith(5, 2, 2, 3);
    expect(setValues).toHaveBeenCalledWith(rows);
    expect(sheet.getLastRow).not.toHaveBeenCalled();
  });

  test("deleteRows は sheet.deleteRows を 1 回で呼ぶ", () => {
    const { sheet, getRange } = createSpySheet();

    immediateSheetWriter.deleteRows(sheet, 4, 3);

    expect(sheet.deleteRows).toHaveBeenCalledTimes(1);
    expect(sheet.deleteRows).toHaveBeenCalledWith(4, 3);
    expect(sheet.deleteRow).not.toHaveBeenCalled();
    expect(getRange).not.toHaveBeenCalled();
  });
});

describe("resolveWriter", () => {
  test("未指定なら immediateSheetWriter を返す", () => {
    expect(resolveWriter(undefined)).toBe(immediateSheetWriter);
  });

  test("指定されたライタをそのまま返す", () => {
    const { writer } = createFakeWriter();
    expect(resolveWriter(writer)).toBe(writer);
  });
});

describe("ライタ差し替え時はシートへ直接書き込まれない", () => {
  test("createFunc の書き込みは注入ライタに届く", () => {
    const util = getMutableMockControllerUtil();
    const { writer, calls } = createFakeWriter();
    util.writer = writer;
    const before = util.sheet._getMockData();

    createFunc(util, { data: { 名前: "Ivy", 年齢: 20 } });

    expect(calls).toEqual([
      {
        method: "appendRows",
        args: [util.sheet, 1, 5, [["Ivy", 20, "", "", ""]]],
      },
    ]);
    expect(util.sheet._getMockData()).toEqual(before);
  });

  test("createManyFunc の書き込みは注入ライタに届く", () => {
    const util = getMutableMockControllerUtil();
    const { writer, calls } = createFakeWriter();
    util.writer = writer;
    const before = util.sheet._getMockData();

    createManyFunc(util, {
      data: [{ 名前: "Ivy" }, { 名前: "Jack" }],
    });

    expect(calls).toEqual([
      {
        method: "appendRows",
        args: [
          util.sheet,
          1,
          5,
          [
            ["Ivy", "", "", "", ""],
            ["Jack", "", "", "", ""],
          ],
        ],
      },
    ]);
    expect(util.sheet._getMockData()).toEqual(before);
  });

  test("updateManyFunc の書き込みは注入ライタに届く", () => {
    const util = getMutableMockControllerUtil();
    const { writer, calls } = createFakeWriter();
    util.writer = writer;
    const before = util.sheet._getMockData();

    updateManyFunc(util, { where: { 名前: "Alice" }, data: { 年齢: 29 } });

    expect(calls).toEqual([
      {
        method: "updateRow",
        args: [
          util.sheet,
          2,
          1,
          5,
          ["Alice", 29, "Tokyo", "100-0001", "Engineer"],
        ],
      },
    ]);
    expect(util.sheet._getMockData()).toEqual(before);
  });

  test("resolveNestedUpdate の書き込みは注入ライタに届く", () => {
    const util = getMutableMockControllerUtil();
    const { writer, calls } = createFakeWriter();
    util.writer = writer;
    const before = util.sheet._getMockData();

    resolveNestedUpdate(
      util,
      { where: { 名前: "Bob" }, data: { 住所: "Nagoya" } },
      undefined,
    );

    expect(calls).toEqual([
      {
        method: "updateRow",
        args: [
          util.sheet,
          3,
          1,
          5,
          ["Bob", 35, "Nagoya", "550-0001", "Designer"],
        ],
      },
    ]);
    expect(util.sheet._getMockData()).toEqual(before);
  });

  test("deleteManyFunc の削除は注入ライタに届く", () => {
    const util = getMutableMockControllerUtil();
    const { writer, calls } = createFakeWriter();
    util.writer = writer;
    const before = util.sheet._getMockData();

    deleteManyFunc(util, { where: { 住所: "Kyoto" } });

    expect(calls).toEqual([
      { method: "deleteRow", args: [util.sheet, 9] },
      { method: "deleteRow", args: [util.sheet, 5] },
    ]);
    expect(util.sheet._getMockData()).toEqual(before);
    expect(util.sheet.deleteRow).not.toHaveBeenCalled();
  });
});
