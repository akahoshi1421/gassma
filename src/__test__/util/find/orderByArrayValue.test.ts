import { GassmaClient } from "../../../gassma";
import { GassmaInvalidValueError } from "../../../errors/argument/argumentError";
import { separateRelationOrderBy } from "../../../util/find/findUtil/separateRelationOrderBy";
import { createCrossRealmValue } from "../../consts/crossRealm";
import {
  buildTestClient,
  clearSpreadsheetApp,
  sheetOf,
} from "../extends/extendsTestClient";

afterEach(() => {
  clearSpreadsheetApp();
});

const looseSheet = (name: string): any =>
  sheetOf(buildTestClient({ relations: true }), name);

const orderByErrorMessage =
  'Invalid value for argument `orderBy`. Expected "asc" | "desc".';

describe("orderBy のスカラー列に配列を渡した場合", () => {
  test("空配列は orderBy を名指しした GassmaInvalidValueError になる", () => {
    const users = looseSheet("Users");
    const fn = () => users.findMany({ orderBy: { name: [] } });
    expect(fn).toThrow(GassmaInvalidValueError);
    expect(fn).toThrow(orderByErrorMessage);
  });

  test("要素入り配列も同じエラーになる", () => {
    const users = looseSheet("Users");
    const fn = () => users.findMany({ orderBy: { name: ["asc"] } });
    expect(fn).toThrow(GassmaInvalidValueError);
    expect(fn).toThrow(orderByErrorMessage);
  });

  test("orderBy 配列の要素の中の配列値も同じエラーになる", () => {
    const users = looseSheet("Users");
    const fn = () => users.findMany({ orderBy: [{ name: ["desc"] }] });
    expect(fn).toThrow(GassmaInvalidValueError);
    expect(fn).toThrow(orderByErrorMessage);
  });
});

describe("orderBy の正常系は変わらない", () => {
  test('{ name: "asc" } で昇順ソートされる', () => {
    const users = looseSheet("Users");
    const result = users.findMany({ orderBy: { name: "asc" } });
    expect(result.map((row: { name: string }) => row.name)).toEqual([
      "Alice",
      "Bob",
      "Carol",
    ]);
  });

  test('{ name: { sort: "desc" } } で降順ソートされる', () => {
    const users = looseSheet("Users");
    const result = users.findMany({ orderBy: { name: { sort: "desc" } } });
    expect(result.map((row: { name: string }) => row.name)).toEqual([
      "Carol",
      "Bob",
      "Alice",
    ]);
  });

  test("リレーションの orderBy は正常に動く", () => {
    const posts = looseSheet("Posts");
    const result = posts.findMany({ orderBy: { author: { name: "desc" } } });
    expect(result.map((row: { id: number }) => row.id)).toEqual([102, 101]);
  });
});

describe("orderBy のリレーションキーに不正な値を渡した場合", () => {
  const authorErrorMessage =
    "Invalid value for argument `author`. Expected a relation orderBy object.";

  test("空配列はリレーション用のエラーになる", () => {
    const posts = looseSheet("Posts");
    const fn = () => posts.findMany({ orderBy: { author: [] } });
    expect(fn).toThrow(GassmaInvalidValueError);
    expect(fn).toThrow(authorErrorMessage);
  });

  test("Date もリレーション用のエラーになる", () => {
    const posts = looseSheet("Posts");
    const fn = () => posts.findMany({ orderBy: { author: new Date() } });
    expect(fn).toThrow(GassmaInvalidValueError);
    expect(fn).toThrow(authorErrorMessage);
  });
});

describe("別 realm の配列でも同じエラーになる", () => {
  test("別 realm の空配列", () => {
    const users = looseSheet("Users");
    const fn = () =>
      users.findMany({ orderBy: { name: createCrossRealmValue("[]") } });
    expect(fn).toThrow(GassmaInvalidValueError);
    expect(fn).toThrow(orderByErrorMessage);
  });

  test("別 realm の要素入り配列", () => {
    const users = looseSheet("Users");
    const fn = () =>
      users.findMany({ orderBy: { name: createCrossRealmValue("['asc']") } });
    expect(fn).toThrow(GassmaInvalidValueError);
    expect(fn).toThrow(orderByErrorMessage);
  });
});

describe("separateRelationOrderBy の配列値の分類", () => {
  test("配列値は scalar 側に分類され hasRelationOrderBy は false のまま", () => {
    const arrayValue: any = ["asc"];
    const result = separateRelationOrderBy([{ name: arrayValue }]);
    expect(result.scalarOrderBy).toEqual([{ name: ["asc"] }]);
    expect(result.relationOrderBy).toEqual([]);
    expect(result.hasRelationOrderBy).toBe(false);
  });

  test("空配列値も scalar 側に分類される", () => {
    const arrayValue: any = [];
    const result = separateRelationOrderBy([{ name: arrayValue }]);
    expect(result.scalarOrderBy).toEqual([{ name: [] }]);
    expect(result.hasRelationOrderBy).toBe(false);
  });
});

describe("sort / nulls という名前の列", () => {
  const buildSortColumnClient = (): GassmaClient => {
    const data = [
      ["id", "sort", "nulls"],
      [1, "b", "y"],
      [2, "a", "z"],
      [3, "c", "x"],
    ];
    const sheet = {
      getName: () => "Items",
      getLastRow: () => data.length,
      getLastColumn: () => data[0].length,
      getRange: (
        row: number,
        col: number,
        numRows: number,
        numCols: number,
      ) => ({
        getValues: () =>
          data
            .slice(row - 1, row - 1 + numRows)
            .map((r) => r.slice(col - 1, col - 1 + numCols)),
        setValues: () => {},
      }),
      getDataRange: () => ({ getValues: () => data }),
      deleteRow: () => {},
      deleteRows: () => {},
    };
    const mockSpreadsheet = {
      getId: () => "test-sort-column-spreadsheet",
      getSheets: () => [sheet],
      getSheetByName: (name: string) => (name === "Items" ? sheet : null),
    };
    Object.assign(globalThis, {
      SpreadsheetApp: { getActiveSpreadsheet: () => mockSpreadsheet },
    });
    return new GassmaClient();
  };

  test('orderBy: { sort: "asc" } で sort 列でソートできる', () => {
    const items: any = sheetOf(buildSortColumnClient(), "Items");
    const result = items.findMany({ orderBy: { sort: "asc" } });
    expect(result.map((row: { id: number }) => row.id)).toEqual([2, 1, 3]);
  });

  test('orderBy: { nulls: "desc" } で nulls 列でソートできる', () => {
    const items: any = sheetOf(buildSortColumnClient(), "Items");
    const result = items.findMany({ orderBy: { nulls: "desc" } });
    expect(result.map((row: { id: number }) => row.id)).toEqual([2, 1, 3]);
  });

  test('orderBy: { sort: { sort: "desc" } } も動く', () => {
    const items: any = sheetOf(buildSortColumnClient(), "Items");
    const result = items.findMany({ orderBy: { sort: { sort: "desc" } } });
    expect(result.map((row: { id: number }) => row.id)).toEqual([3, 1, 2]);
  });

  test("sort 列に配列を渡しても orderBy を名指ししたエラーになる", () => {
    const items: any = sheetOf(buildSortColumnClient(), "Items");
    const fn = () => items.findMany({ orderBy: { sort: [] } });
    expect(fn).toThrow(GassmaInvalidValueError);
    expect(fn).toThrow(orderByErrorMessage);
  });
});
