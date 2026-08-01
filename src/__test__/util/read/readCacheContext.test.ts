import type { GassmaControllerUtil } from "../../../types/gassmaControllerUtilType";
import {
  applyReadCache,
  runWithoutReadCache,
  runWithReadCache,
} from "../../../util/read/readCacheContext";
import type { SheetReader } from "../../../util/read/sheetReader";
import type { SheetWriter } from "../../../util/write/sheetWriter";

const makeSpyReader = () => {
  const getLastRow = jest.fn(() => 3);
  const getRangeValues = jest.fn(() => [[1, "Alice"]]);
  const reader: SheetReader = { getLastRow, getRangeValues };
  return { reader, getLastRow, getRangeValues };
};

const makeSpyWriter = () => {
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
  return { writer, appendRows };
};

const makeUtil = (
  reader: SheetReader,
  writer: SheetWriter,
): GassmaControllerUtil => {
  const sheet: any = {};
  return {
    sheet,
    startRowNumber: 1,
    startColumnNumber: 1,
    endColumnNumber: 2,
    reader,
    writer,
  };
};

describe("readCacheContext", () => {
  test("コンテキスト外では applyReadCache は util をそのまま返す", () => {
    const spy = makeSpyReader();
    const util = makeUtil(spy.reader, makeSpyWriter().writer);

    expect(applyReadCache(util)).toBe(util);
  });

  test("runWithReadCache は fn の戻り値をそのまま返す", () => {
    expect(runWithReadCache(() => 42)).toBe(42);
  });

  test("コンテキスト内では同一読みが base 1回になる", () => {
    const spy = makeSpyReader();
    const util = makeUtil(spy.reader, makeSpyWriter().writer);

    runWithReadCache(() => {
      const wrapped = applyReadCache(util);
      wrapped.reader.getLastRow(util.sheet);
      wrapped.reader.getLastRow(util.sheet);
      wrapped.reader.getRangeValues(util.sheet, 1, 1, 1, 2);
      wrapped.reader.getRangeValues(util.sheet, 1, 1, 1, 2);
    });

    expect(spy.getLastRow).toHaveBeenCalledTimes(1);
    expect(spy.getRangeValues).toHaveBeenCalledTimes(1);
  });

  test("途中で applyReadCache し直しても同じキャッシュを共有する", () => {
    const spy = makeSpyReader();
    const util = makeUtil(spy.reader, makeSpyWriter().writer);

    runWithReadCache(() => {
      applyReadCache(util).reader.getRangeValues(util.sheet, 1, 1, 1, 2);
      applyReadCache(util).reader.getRangeValues(util.sheet, 1, 1, 1, 2);
    });

    expect(spy.getRangeValues).toHaveBeenCalledTimes(1);
  });

  test("ネストした runWithReadCache は外側のキャッシュを共有する", () => {
    const spy = makeSpyReader();
    const util = makeUtil(spy.reader, makeSpyWriter().writer);

    runWithReadCache(() => {
      applyReadCache(util).reader.getRangeValues(util.sheet, 1, 1, 1, 2);
      runWithReadCache(() => {
        applyReadCache(util).reader.getRangeValues(util.sheet, 1, 1, 1, 2);
      });
      applyReadCache(util).reader.getRangeValues(util.sheet, 1, 1, 1, 2);
    });

    expect(spy.getRangeValues).toHaveBeenCalledTimes(1);
  });

  test("runWithReadCache を抜けるとキャッシュは破棄される", () => {
    const spy = makeSpyReader();
    const util = makeUtil(spy.reader, makeSpyWriter().writer);

    runWithReadCache(() => {
      applyReadCache(util).reader.getRangeValues(util.sheet, 1, 1, 1, 2);
    });
    runWithReadCache(() => {
      applyReadCache(util).reader.getRangeValues(util.sheet, 1, 1, 1, 2);
    });

    expect(spy.getRangeValues).toHaveBeenCalledTimes(2);
    expect(applyReadCache(util)).toBe(util);
  });

  test("fn が throw してもキャッシュは破棄される", () => {
    const spy = makeSpyReader();
    const util = makeUtil(spy.reader, makeSpyWriter().writer);

    expect(() =>
      runWithReadCache(() => {
        applyReadCache(util).reader.getRangeValues(util.sheet, 1, 1, 1, 2);
        throw new Error("boom");
      }),
    ).toThrow("boom");

    expect(applyReadCache(util)).toBe(util);
    runWithReadCache(() => {
      applyReadCache(util).reader.getRangeValues(util.sheet, 1, 1, 1, 2);
    });
    expect(spy.getRangeValues).toHaveBeenCalledTimes(2);
  });

  test("ネスト内側で throw しても外側のキャッシュは生きている", () => {
    const spy = makeSpyReader();
    const util = makeUtil(spy.reader, makeSpyWriter().writer);

    runWithReadCache(() => {
      applyReadCache(util).reader.getRangeValues(util.sheet, 1, 1, 1, 2);
      expect(() =>
        runWithReadCache(() => {
          throw new Error("inner");
        }),
      ).toThrow("inner");
      applyReadCache(util).reader.getRangeValues(util.sheet, 1, 1, 1, 2);
    });

    expect(spy.getRangeValues).toHaveBeenCalledTimes(1);
  });

  test("コンテキスト内の書き込みはキャッシュを破棄してから委譲される", () => {
    const spyReader = makeSpyReader();
    const spyWriter = makeSpyWriter();
    const util = makeUtil(spyReader.reader, spyWriter.writer);

    runWithReadCache(() => {
      const wrapped = applyReadCache(util);
      wrapped.reader.getRangeValues(util.sheet, 1, 1, 1, 2);
      wrapped.writer.appendRows(util.sheet, 1, 2, [[2, "Bob"]]);
      wrapped.reader.getRangeValues(util.sheet, 1, 1, 1, 2);
    });

    expect(spyWriter.appendRows).toHaveBeenCalledWith(util.sheet, 1, 2, [
      [2, "Bob"],
    ]);
    expect(spyReader.getRangeValues).toHaveBeenCalledTimes(2);
  });

  test("バリア内では runWithReadCache はキャッシュを作らない", () => {
    const spy = makeSpyReader();
    const util = makeUtil(spy.reader, makeSpyWriter().writer);

    runWithoutReadCache(() => {
      runWithReadCache(() => {
        expect(applyReadCache(util)).toBe(util);
        applyReadCache(util).reader.getRangeValues(util.sheet, 1, 1, 1, 2);
        applyReadCache(util).reader.getRangeValues(util.sheet, 1, 1, 1, 2);
      });
    });

    expect(spy.getRangeValues).toHaveBeenCalledTimes(2);
  });

  test("バリアは fn の戻り値をそのまま返す", () => {
    expect(runWithoutReadCache(() => "ok")).toBe("ok");
  });

  test("窓が開いている最中にバリアへ入ると applyReadCache は素通しになる", () => {
    const spy = makeSpyReader();
    const util = makeUtil(spy.reader, makeSpyWriter().writer);

    runWithReadCache(() => {
      applyReadCache(util).reader.getRangeValues(util.sheet, 1, 1, 1, 2);
      runWithoutReadCache(() => {
        expect(applyReadCache(util)).toBe(util);
      });
    });

    expect(spy.getRangeValues).toHaveBeenCalledTimes(1);
  });

  test("窓の最中にバリアへ入ると窓のキャッシュは破棄され、バリア後は再読になる", () => {
    const spy = makeSpyReader();
    const util = makeUtil(spy.reader, makeSpyWriter().writer);

    runWithReadCache(() => {
      applyReadCache(util).reader.getRangeValues(util.sheet, 1, 1, 1, 2);
      runWithoutReadCache(() => {});
      applyReadCache(util).reader.getRangeValues(util.sheet, 1, 1, 1, 2);
      applyReadCache(util).reader.getRangeValues(util.sheet, 1, 1, 1, 2);
    });

    expect(spy.getRangeValues).toHaveBeenCalledTimes(2);
  });

  test("ネストしたバリアを1つ抜けても抑止は続き、全て抜けると解除される", () => {
    const spy = makeSpyReader();
    const util = makeUtil(spy.reader, makeSpyWriter().writer);

    runWithoutReadCache(() => {
      runWithoutReadCache(() => {});
      runWithReadCache(() => {
        expect(applyReadCache(util)).toBe(util);
      });
    });
    runWithReadCache(() => {
      applyReadCache(util).reader.getRangeValues(util.sheet, 1, 1, 1, 2);
      applyReadCache(util).reader.getRangeValues(util.sheet, 1, 1, 1, 2);
    });

    expect(spy.getRangeValues).toHaveBeenCalledTimes(1);
  });

  test("バリア内で throw しても抑止は解除される", () => {
    const spy = makeSpyReader();
    const util = makeUtil(spy.reader, makeSpyWriter().writer);

    expect(() =>
      runWithoutReadCache(() => {
        throw new Error("write failed");
      }),
    ).toThrow("write failed");

    runWithReadCache(() => {
      applyReadCache(util).reader.getRangeValues(util.sheet, 1, 1, 1, 2);
      applyReadCache(util).reader.getRangeValues(util.sheet, 1, 1, 1, 2);
    });
    expect(spy.getRangeValues).toHaveBeenCalledTimes(1);
  });

  test("reader / writer 未指定の util でも immediate にフォールバックして動く", () => {
    const getLastRow = jest.fn(() => 2);
    const getValues = jest.fn(() => [["id", "name"]]);
    const sheet: any = {
      getLastRow,
      getRange: () => ({ getValues }),
    };
    const util: GassmaControllerUtil = {
      sheet,
      startRowNumber: 1,
      startColumnNumber: 1,
      endColumnNumber: 2,
    };

    runWithReadCache(() => {
      const wrapped = applyReadCache(util);
      expect(wrapped.reader.getLastRow(sheet)).toBe(2);
      expect(wrapped.reader.getLastRow(sheet)).toBe(2);
      expect(wrapped.reader.getRangeValues(sheet, 1, 1, 1, 2)).toEqual([
        ["id", "name"],
      ]);
      expect(wrapped.reader.getRangeValues(sheet, 1, 1, 1, 2)).toEqual([
        ["id", "name"],
      ]);
    });

    expect(getLastRow).toHaveBeenCalledTimes(1);
    expect(getValues).toHaveBeenCalledTimes(1);
  });
});
