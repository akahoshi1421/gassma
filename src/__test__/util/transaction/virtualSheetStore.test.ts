import { createVirtualSheetStore } from "../../../util/transaction/virtualSheetStore";
import { makeLoggedSheet } from "./transactionTestClient";

const initialUsers = [
  ["id", "name", "age"],
  [1, "Alice", 20],
  [2, "Bob", 30],
];

describe("virtualSheetStore の getRangeValues", () => {
  test("グリッド全体をそのまま返す", () => {
    const { sheet } = makeLoggedSheet("Users", initialUsers);
    const store = createVirtualSheetStore();

    expect(store.getRangeValues(sheet, 1, 1, 3, 3)).toEqual(initialUsers);
  });

  test("部分範囲を返す", () => {
    const { sheet } = makeLoggedSheet("Users", initialUsers);
    const store = createVirtualSheetStore();

    expect(store.getRangeValues(sheet, 2, 2, 2, 2)).toEqual([
      ["Alice", 20],
      ["Bob", 30],
    ]);
  });

  test("行が要求列数より短い場合は空文字で埋める", () => {
    const { sheet } = makeLoggedSheet("Users", initialUsers);
    const store = createVirtualSheetStore();

    store.appendRows(sheet, 1, 2, [[3, "Carol"]]);

    expect(store.getRangeValues(sheet, 4, 1, 1, 5)).toEqual([
      [3, "Carol", "", "", ""],
    ]);
  });

  test("存在しない行は空文字の行として返す", () => {
    const { sheet } = makeLoggedSheet("Users", initialUsers);
    const store = createVirtualSheetStore();

    expect(store.getRangeValues(sheet, 3, 1, 3, 3)).toEqual([
      [2, "Bob", 30],
      ["", "", ""],
      ["", "", ""],
    ]);
  });

  test("行の途中に undefined が入っている疎行は空文字になる", () => {
    const { sheet } = makeLoggedSheet("Users", initialUsers);
    const store = createVirtualSheetStore();

    store.updateRow(sheet, 4, 3, 1, [99]);

    expect(store.getRangeValues(sheet, 4, 1, 1, 3)).toEqual([["", "", 99]]);
  });

  test("列オフセット付きでも短い行が埋まる", () => {
    const { sheet } = makeLoggedSheet("Users", initialUsers);
    const store = createVirtualSheetStore();

    expect(store.getRangeValues(sheet, 2, 2, 1, 4)).toEqual([
      ["Alice", 20, "", ""],
    ]);
  });

  test("返り値を破壊的変更しても内部状態が壊れない", () => {
    const { sheet } = makeLoggedSheet("Users", initialUsers);
    const store = createVirtualSheetStore();

    const first = store.getRangeValues(sheet, 2, 1, 2, 3);
    first[0][1] = "MUTATED";
    first[1] = ["X", "Y", "Z"];

    expect(store.getRangeValues(sheet, 2, 1, 2, 3)).toEqual([
      [1, "Alice", 20],
      [2, "Bob", 30],
    ]);
  });

  test("返り値の変更が updateRow の対象行にも影響しない", () => {
    const { sheet } = makeLoggedSheet("Users", initialUsers);
    const store = createVirtualSheetStore();

    const values = store.getRangeValues(sheet, 2, 1, 1, 3);
    values[0][2] = 999;
    store.updateRow(sheet, 2, 1, 3, [1, "Alice", 21]);

    expect(store.getRangeValues(sheet, 2, 1, 1, 3)).toEqual([[1, "Alice", 21]]);
  });
});
