import { GassmaMissingArgumentError } from "../../../errors/argument/argumentError";
import { migrateSheets } from "../../../util/migrate/migrateSheets";

type SetValuesCall = {
  row: number;
  col: number;
  numRows: number;
  numCols: number;
  values: unknown[][];
};

type InsertColumnsAfterCall = {
  afterPosition: number;
  howMany: number;
};

type MockRange = {
  getValues: () => unknown[][];
  setValues: (values: unknown[][]) => void;
};

type MockSheet = {
  getName: () => string;
  getLastRow: () => number;
  getLastColumn: () => number;
  getMaxColumns: () => number;
  getRange: (
    row: number,
    col: number,
    numRows: number,
    numCols: number,
  ) => MockRange;
  insertColumnsAfter: (afterPosition: number, howMany: number) => void;
  deleteColumn: (columnPosition: number) => void;
};

type SheetHandle = {
  sheet: MockSheet;
  snapshot: () => unknown[][];
  writes: SetValuesCall[];
  columnInsertions: InsertColumnsAfterCall[];
  deletedColumns: number[];
};

const DEFAULT_MAX_COLUMNS = 26;

const makeSheet = (
  name: string,
  initial: unknown[][],
  initialMaxColumns: number = DEFAULT_MAX_COLUMNS,
): SheetHandle => {
  const data = initial.map((row) => [...row]);
  const writes: SetValuesCall[] = [];
  const columnInsertions: InsertColumnsAfterCall[] = [];
  const deletedColumns: number[] = [];
  let maxColumns = initialMaxColumns;
  const width = () => (data[0] ? data[0].length : 0);
  const sheet: MockSheet = {
    getName: () => name,
    getLastRow: () => data.length,
    getLastColumn: () => width(),
    getMaxColumns: () => maxColumns,
    getRange: (row, col, numRows, numCols) => {
      if (col - 1 + numCols > maxColumns) {
        throw new Error(
          `Range exceeds grid limits. Max columns: ${maxColumns}`,
        );
      }
      return {
        getValues: () =>
          Array.from({ length: numRows }, (_, i) =>
            Array.from({ length: numCols }, (_, j) => {
              const value = data[row - 1 + i]?.[col - 1 + j];
              return value === undefined ? "" : value;
            }),
          ),
        setValues: (values) => {
          writes.push({ row, col, numRows, numCols, values });
          values.forEach((rowValues, i) => {
            while (data.length < row + i) data.push([]);
            rowValues.forEach((value, j) => {
              data[row - 1 + i][col - 1 + j] = value;
            });
          });
        },
      };
    },
    insertColumnsAfter: (afterPosition, howMany) => {
      if (afterPosition < 1 || afterPosition > maxColumns || howMany < 1) {
        throw new Error("Those columns are out of bounds.");
      }
      columnInsertions.push({ afterPosition, howMany });
      data.forEach((row) => {
        if (row.length <= afterPosition) return;
        const blanks = Array.from({ length: howMany }, () => "");
        row.splice(afterPosition, 0, ...blanks);
      });
      maxColumns += howMany;
    },
    deleteColumn: (columnPosition) => {
      if (columnPosition < 1 || columnPosition > maxColumns) {
        throw new Error("Those columns are out of bounds.");
      }
      if (maxColumns <= 1) {
        throw new Error("You can't delete all the columns in the sheet.");
      }
      deletedColumns.push(columnPosition);
      data.forEach((row) => {
        if (row.length < columnPosition) return;
        row.splice(columnPosition - 1, 1);
      });
      maxColumns -= 1;
    },
  };
  return {
    sheet,
    snapshot: () => data.map((row) => [...row]),
    writes,
    columnInsertions,
    deletedColumns,
  };
};

const withExtents = (
  handle: SheetHandle,
  lastRow: number,
  lastColumn: number,
): SheetHandle => ({
  ...handle,
  sheet: {
    ...handle.sheet,
    getLastRow: () => lastRow,
    getLastColumn: () => lastColumn,
  },
});

type MockSpreadsheet = {
  getId: () => string;
  getSheets: () => MockSheet[];
  getSheetByName: (name: string) => MockSheet | null;
  insertSheet: (name: string) => MockSheet;
  deleteSheet: (sheet: MockSheet) => void;
};

type SpreadsheetHandle = {
  spreadsheet: MockSpreadsheet;
  handleOf: (name: string) => SheetHandle;
  insertedNames: string[];
  deletedNames: string[];
  sheetNames: () => string[];
};

const makeSpreadsheet = (
  id: string,
  handles: SheetHandle[],
): SpreadsheetHandle => {
  const all = [...handles];
  const insertedNames: string[] = [];
  const deletedNames: string[] = [];
  const spreadsheet: MockSpreadsheet = {
    getId: () => id,
    getSheets: () => all.map((handle) => handle.sheet),
    getSheetByName: (name) =>
      all.find((handle) => handle.sheet.getName() === name)?.sheet ?? null,
    insertSheet: (name) => {
      if (all.some((handle) => handle.sheet.getName() === name)) {
        throw new Error(`A sheet with the name "${name}" already exists.`);
      }
      const handle = makeSheet(name, []);
      all.push(handle);
      insertedNames.push(name);
      return handle.sheet;
    },
    deleteSheet: (sheet) => {
      if (all.length <= 1) {
        throw new Error("You can't remove all the sheets in a document.");
      }
      const index = all.findIndex((handle) => handle.sheet === sheet);
      if (index === -1) {
        throw new Error(`mock sheet not found: ${sheet.getName()}`);
      }
      deletedNames.push(sheet.getName());
      all.splice(index, 1);
    },
  };
  const handleOf = (name: string): SheetHandle => {
    const found = all.find((handle) => handle.sheet.getName() === name);
    if (!found) throw new Error(`mock sheet not found: ${name}`);
    return found;
  };
  return {
    spreadsheet,
    handleOf,
    insertedNames,
    deletedNames,
    sheetNames: () => all.map((handle) => handle.sheet.getName()),
  };
};

const installSpreadsheetApp = (
  active: SpreadsheetHandle,
  byId: Record<string, SpreadsheetHandle> = {},
): { openByIdCalls: string[] } => {
  const openByIdCalls: string[] = [];
  Object.assign(globalThis, {
    SpreadsheetApp: {
      getActiveSpreadsheet: () => active.spreadsheet,
      openById: (id: string) => {
        openByIdCalls.push(id);
        const target = byId[id];
        if (!target) throw new Error(`mock spreadsheet not found: ${id}`);
        return target.spreadsheet;
      },
    },
  });
  return { openByIdCalls };
};

let logSpy: jest.SpyInstance;
let warnSpy: jest.SpyInstance;

const messagesOf = (spy: jest.SpyInstance): string[] =>
  spy.mock.calls.map((call) => String(call[0]));

beforeEach(() => {
  logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  logSpy.mockRestore();
  warnSpy.mockRestore();
});

afterAll(() => {
  Object.assign(globalThis, { SpreadsheetApp: undefined });
});

describe("migrateSheets 新規シート作成", () => {
  test("存在しないシートを作成しヘッダーを1行目A列から書き込む", () => {
    const env = makeSpreadsheet("active", []);
    installSpreadsheetApp(env);

    migrateSheets({
      models: [{ name: "User", columns: ["id", "name", "email"] }],
    });

    expect(env.insertedNames).toEqual(["User"]);
    expect(env.handleOf("User").snapshot()).toEqual([["id", "name", "email"]]);
    const logs = messagesOf(logSpy);
    expect(
      logs.some((log) => log.includes("created") && log.includes('"User"')),
    ).toBe(true);
  });

  test("複数モデルをまとめて作成できる", () => {
    const env = makeSpreadsheet("active", []);
    installSpreadsheetApp(env);

    migrateSheets({
      models: [
        { name: "User", columns: ["id", "name"] },
        { name: "Post", columns: ["id", "authorId", "title"] },
      ],
    });

    expect(env.sheetNames()).toEqual(["User", "Post"]);
    expect(env.handleOf("Post").snapshot()).toEqual([
      ["id", "authorId", "title"],
    ]);
  });
});

describe("migrateSheets 既存シートへの列追加", () => {
  test("足りない列だけをヘッダー行の末尾へ追加する", () => {
    const users = makeSheet("User", [
      ["id", "name"],
      [1, "Alice"],
    ]);
    const env = makeSpreadsheet("active", [users]);
    installSpreadsheetApp(env);

    migrateSheets({
      models: [{ name: "User", columns: ["id", "name", "email", "age"] }],
    });

    expect(users.snapshot()).toEqual([
      ["id", "name", "email", "age"],
      [1, "Alice"],
    ]);
    expect(env.insertedNames).toEqual([]);
    const logs = messagesOf(logSpy);
    expect(
      logs.some(
        (log) =>
          log.includes("added") &&
          log.includes("email") &&
          log.includes("age") &&
          log.includes('"User"'),
      ),
    ).toBe(true);
  });

  test("既存の空シートには全列を1行目A列から書き込む", () => {
    const empty = makeSheet("User", []);
    const env = makeSpreadsheet("active", [empty]);
    installSpreadsheetApp(env);

    migrateSheets({ models: [{ name: "User", columns: ["id", "name"] }] });

    expect(empty.snapshot()).toEqual([["id", "name"]]);
    expect(env.insertedNames).toEqual([]);
  });

  test("列追加時もヘッダー行(1行目)以外には書き込まない", () => {
    const users = makeSheet("User", [["id"], [1], [2]]);
    const env = makeSpreadsheet("active", [users]);
    installSpreadsheetApp(env);

    migrateSheets({ models: [{ name: "User", columns: ["id", "flag"] }] });

    expect(users.writes.length).toBeGreaterThan(0);
    users.writes.forEach((write) => {
      expect(write.row).toBe(1);
      expect(write.numRows).toBe(1);
    });
    expect(users.snapshot()).toEqual([["id", "flag"], [1], [2]]);
  });
});

describe("migrateSheets グリッド上限", () => {
  const columnNames = (count: number, prefix = "col"): string[] =>
    Array.from({ length: count }, (_, i) => `${prefix}${i + 1}`);

  test("デフォルト26列を超えるモデルは新規シートのグリッドを拡張して作成する", () => {
    const env = makeSpreadsheet("active", []);
    installSpreadsheetApp(env);
    const columns = columnNames(30);

    migrateSheets({ models: [{ name: "Wide", columns }] });

    expect(env.handleOf("Wide").snapshot()).toEqual([columns]);
    expect(env.handleOf("Wide").columnInsertions).toEqual([
      { afterPosition: 26, howMany: 4 },
    ]);
    expect(env.handleOf("Wide").sheet.getMaxColumns()).toBe(30);
  });

  test("既存シートの空き列が足りない場合はグリッドを拡張して列を追加する", () => {
    const columns = columnNames(24);
    const wide = makeSheet("Wide", [columns]);
    const env = makeSpreadsheet("active", [wide]);
    installSpreadsheetApp(env);
    const extras = columnNames(5, "extra");

    migrateSheets({
      models: [{ name: "Wide", columns: [...columns, ...extras] }],
    });

    expect(wide.snapshot()).toEqual([[...columns, ...extras]]);
    expect(wide.columnInsertions).toEqual([{ afterPosition: 26, howMany: 3 }]);
    expect(wide.sheet.getMaxColumns()).toBe(29);
  });

  test("列削除で maxColumns が詰まった既存シートにも列を追加できる", () => {
    const trimmed = makeSheet("User", [["id", "name", "email"]], 3);
    const env = makeSpreadsheet("active", [trimmed]);
    installSpreadsheetApp(env);

    migrateSheets({
      models: [
        { name: "User", columns: ["id", "name", "email", "age", "flag"] },
      ],
    });

    expect(trimmed.snapshot()).toEqual([
      ["id", "name", "email", "age", "flag"],
    ]);
    expect(trimmed.columnInsertions).toEqual([
      { afterPosition: 3, howMany: 2 },
    ]);
    expect(trimmed.sheet.getMaxColumns()).toBe(5);
  });

  test("グリッドに空きがある場合は insertColumnsAfter を呼ばない", () => {
    const users = makeSheet("User", [["id", "name"]]);
    const env = makeSpreadsheet("active", [users]);
    installSpreadsheetApp(env);

    migrateSheets({
      models: [
        { name: "User", columns: ["id", "name", "email"] },
        { name: "Post", columns: ["id", "title"] },
      ],
    });

    expect(users.columnInsertions).toEqual([]);
    expect(env.handleOf("Post").columnInsertions).toEqual([]);
    expect(users.snapshot()).toEqual([["id", "name", "email"]]);
    expect(env.handleOf("Post").snapshot()).toEqual([["id", "title"]]);
  });
});

describe("migrateSheets 冪等性", () => {
  test("2回実行しても2回目は書き込みが発生しない", () => {
    const users = makeSheet("User", [["id"], [1]]);
    const env = makeSpreadsheet("active", [users]);
    installSpreadsheetApp(env);
    const models = [
      { name: "User", columns: ["id", "name"] },
      { name: "Post", columns: ["id", "title"] },
    ];

    migrateSheets({ models });
    const userSnapshot = users.snapshot();
    const postSnapshot = env.handleOf("Post").snapshot();
    const userWriteCount = users.writes.length;
    const postWriteCount = env.handleOf("Post").writes.length;
    const logCountAfterFirst = logSpy.mock.calls.length;

    migrateSheets({ models });

    expect(env.insertedNames).toEqual(["Post"]);
    expect(users.snapshot()).toEqual(userSnapshot);
    expect(env.handleOf("Post").snapshot()).toEqual(postSnapshot);
    expect(users.writes.length).toBe(userWriteCount);
    expect(env.handleOf("Post").writes.length).toBe(postWriteCount);
    const secondRunLogs = messagesOf(logSpy).slice(logCountAfterFirst);
    expect(secondRunLogs.some((log) => log.includes("up to date"))).toBe(true);
    expect(
      secondRunLogs.some(
        (log) => log.includes("created") || log.includes("added"),
      ),
    ).toBe(false);
  });
});

describe("migrateSheets 非破壊", () => {
  test("既存列の順序が schema と違っても並べ替えない", () => {
    const users = makeSheet("User", [
      ["name", "id"],
      ["Alice", 1],
    ]);
    const env = makeSpreadsheet("active", [users]);
    installSpreadsheetApp(env);

    migrateSheets({ models: [{ name: "User", columns: ["id", "name"] }] });

    expect(users.snapshot()).toEqual([
      ["name", "id"],
      ["Alice", 1],
    ]);
    expect(users.writes).toEqual([]);
  });

  test("schema に無い列とシートは削除せず console.warn する", () => {
    const users = makeSheet("User", [
      ["id", "", "legacy"],
      [1, "", "x"],
    ]);
    const old = makeSheet("Old", [["a"]]);
    const env = makeSpreadsheet("active", [users, old]);
    installSpreadsheetApp(env);

    migrateSheets({ models: [{ name: "User", columns: ["id"] }] });

    expect(users.snapshot()).toEqual([
      ["id", "", "legacy"],
      [1, "", "x"],
    ]);
    expect(users.writes).toEqual([]);
    expect(env.sheetNames()).toEqual(["User", "Old"]);
    const warns = messagesOf(warnSpy);
    expect(
      warns.some(
        (warn) => warn.includes('"legacy"') && warn.includes('"User"'),
      ),
    ).toBe(true);
    expect(warns.some((warn) => warn.includes('"Old"'))).toBe(true);
    expect(warns.some((warn) => warn.includes('""'))).toBe(false);
  });
});

describe("migrateSheets acceptDataLoss 無効時", () => {
  test("acceptDataLoss: false では schema に無い列もシートも削除しない", () => {
    const users = makeSheet("User", [
      ["id", "legacy"],
      [1, "x"],
    ]);
    const old = makeSheet("Old", [["a"], [1]]);
    const env = makeSpreadsheet("active", [users, old]);
    installSpreadsheetApp(env);

    migrateSheets({
      models: [{ name: "User", columns: ["id"] }],
      acceptDataLoss: false,
    });

    expect(users.snapshot()).toEqual([
      ["id", "legacy"],
      [1, "x"],
    ]);
    expect(users.deletedColumns).toEqual([]);
    expect(env.sheetNames()).toEqual(["User", "Old"]);
    const warns = messagesOf(warnSpy);
    expect(warns.some((warn) => warn.includes('"legacy"'))).toBe(true);
    expect(warns.some((warn) => warn.includes('"Old"'))).toBe(true);
  });
});

describe("migrateSheets acceptDataLoss 列削除", () => {
  test("schema に無い列を削除し非空セル数を警告する", () => {
    const users = makeSheet("User", [
      ["id", "memo"],
      [1, "a"],
      [2, ""],
      [3, "b"],
    ]);
    const env = makeSpreadsheet("active", [users]);
    installSpreadsheetApp(env);

    migrateSheets({
      models: [{ name: "User", columns: ["id"] }],
      acceptDataLoss: true,
    });

    expect(users.snapshot()).toEqual([["id"], [1], [2], [3]]);
    expect(users.deletedColumns).toEqual([2]);
    expect(users.writes).toEqual([]);
    expect(env.sheetNames()).toEqual(["User"]);
    expect(messagesOf(warnSpy)).toContain(
      'Gassma.migrateSheets: You are about to drop the column "memo" on the sheet "User", which still contains 2 non-empty values.',
    );
  });

  test("複数の余分な列を削除しても位置がずれない", () => {
    const users = makeSheet("User", [
      ["id", "legacy1", "name", "legacy2", "email"],
      [1, "a", "Alice", "b", "alice@example.com"],
    ]);
    const env = makeSpreadsheet("active", [users]);
    installSpreadsheetApp(env);

    migrateSheets({
      models: [{ name: "User", columns: ["id", "name", "email"] }],
      acceptDataLoss: true,
    });

    expect(users.snapshot()).toEqual([
      ["id", "name", "email"],
      [1, "Alice", "alice@example.com"],
    ]);
    const warns = messagesOf(warnSpy);
    expect(warns.some((warn) => warn.includes('"legacy1"'))).toBe(true);
    expect(warns.some((warn) => warn.includes('"legacy2"'))).toBe(true);
  });

  test("足りない列の追加を先に行ってから余分な列を削除する", () => {
    const users = makeSheet("User", [
      ["id", "legacy", "name"],
      [1, "L", "Alice"],
    ]);
    const env = makeSpreadsheet("active", [users]);
    installSpreadsheetApp(env);

    migrateSheets({
      models: [{ name: "User", columns: ["id", "name", "flag"] }],
      acceptDataLoss: true,
    });

    expect(users.snapshot()).toEqual([
      ["id", "name", "flag"],
      [1, "Alice"],
    ]);
    expect(users.writes.length).toBe(1);
    users.writes.forEach((write) => {
      expect(write.row).toBe(1);
      expect(write.numRows).toBe(1);
    });
  });

  test("データセルがすべて空の列は警告なしで削除する", () => {
    const users = makeSheet("User", [
      ["id", "empty"],
      [1, ""],
      [2, ""],
    ]);
    const env = makeSpreadsheet("active", [users]);
    installSpreadsheetApp(env);

    migrateSheets({
      models: [{ name: "User", columns: ["id"] }],
      acceptDataLoss: true,
    });

    expect(users.snapshot()).toEqual([["id"], [1], [2]]);
    expect(users.deletedColumns).toEqual([2]);
    expect(messagesOf(warnSpy)).toEqual([]);
  });

  test("0 や false のセルも非空としてカウントする", () => {
    const users = makeSheet("User", [
      ["id", "legacy"],
      [1, 0],
      [2, false],
      [3, ""],
    ]);
    const env = makeSpreadsheet("active", [users]);
    installSpreadsheetApp(env);

    migrateSheets({
      models: [{ name: "User", columns: ["id"] }],
      acceptDataLoss: true,
    });

    expect(users.snapshot()).toEqual([["id"], [1], [2], [3]]);
    expect(users.deletedColumns).toEqual([2]);
    expect(messagesOf(warnSpy)).toContain(
      'Gassma.migrateSheets: You are about to drop the column "legacy" on the sheet "User", which still contains 2 non-empty values.',
    );
  });

  test("ヘッダーが空文字の列は削除しない", () => {
    const users = makeSheet("User", [
      ["id", "", "legacy"],
      [1, "", "x"],
    ]);
    const env = makeSpreadsheet("active", [users]);
    installSpreadsheetApp(env);

    migrateSheets({
      models: [{ name: "User", columns: ["id"] }],
      acceptDataLoss: true,
    });

    expect(users.snapshot()).toEqual([
      ["id", ""],
      [1, ""],
    ]);
    expect(users.deletedColumns).toEqual([3]);
    const warns = messagesOf(warnSpy);
    expect(warns.some((warn) => warn.includes('""'))).toBe(false);
  });
});

describe("migrateSheets acceptDataLoss シート削除", () => {
  test("schema に無いシートを削除しデータ行数を警告する", () => {
    const users = makeSheet("User", [["id"], [1]]);
    const old = makeSheet("Old", [["a"], [1], [2]]);
    const env = makeSpreadsheet("active", [users, old]);
    installSpreadsheetApp(env);

    migrateSheets({
      models: [{ name: "User", columns: ["id"] }],
      acceptDataLoss: true,
    });

    expect(env.sheetNames()).toEqual(["User"]);
    expect(env.deletedNames).toEqual(["Old"]);
    expect(messagesOf(warnSpy)).toContain(
      'Gassma.migrateSheets: You are about to drop the sheet "Old", which still contains 2 rows.',
    );
  });

  test("データが空のシートは警告なしで削除する", () => {
    const users = makeSheet("User", [["id"]]);
    const empty = makeSheet("Empty", [["a"]]);
    const env = makeSpreadsheet("active", [users, empty]);
    installSpreadsheetApp(env);

    migrateSheets({
      models: [{ name: "User", columns: ["id"] }],
      acceptDataLoss: true,
    });

    expect(env.sheetNames()).toEqual(["User"]);
    expect(env.deletedNames).toEqual(["Empty"]);
    expect(messagesOf(warnSpy)).toEqual([]);
  });

  test("0 や false だけの行もデータ行としてカウントする", () => {
    const users = makeSheet("User", [["id"]]);
    const flags = makeSheet("Flags", [["flag"], [0], [false]]);
    const env = makeSpreadsheet("active", [users, flags]);
    installSpreadsheetApp(env);

    migrateSheets({
      models: [{ name: "User", columns: ["id"] }],
      acceptDataLoss: true,
    });

    expect(env.sheetNames()).toEqual(["User"]);
    expect(env.deletedNames).toEqual(["Flags"]);
    expect(messagesOf(warnSpy)).toContain(
      'Gassma.migrateSheets: You are about to drop the sheet "Flags", which still contains 2 rows.',
    );
  });

  test("最後の1枚になるシートは削除せず警告して残す", () => {
    const old1 = makeSheet("Old1", [["a"], [1]]);
    const old2 = makeSheet("Old2", [["b"]]);
    const env = makeSpreadsheet("active", [old1, old2]);
    installSpreadsheetApp(env);

    migrateSheets({ models: [], acceptDataLoss: true });

    expect(env.deletedNames).toEqual(["Old1"]);
    expect(env.sheetNames()).toEqual(["Old2"]);
    const warns = messagesOf(warnSpy);
    expect(
      warns.some(
        (warn) => warn.includes('"Old2"') && warn.includes("at least one"),
      ),
    ).toBe(true);
  });
});

describe("migrateSheets acceptDataLoss 冪等性", () => {
  test("削除後に再実行しても変更が発生しない", () => {
    const users = makeSheet("User", [
      ["id", "legacy"],
      [1, "x"],
    ]);
    const old = makeSheet("Old", [["a"], [1]]);
    const env = makeSpreadsheet("active", [users, old]);
    installSpreadsheetApp(env);
    const options = {
      models: [{ name: "User", columns: ["id"] }],
      acceptDataLoss: true,
    };

    migrateSheets(options);
    const snapshotAfterFirst = users.snapshot();
    const writeCountAfterFirst = users.writes.length;
    const deletedColumnsAfterFirst = [...users.deletedColumns];
    const deletedNamesAfterFirst = [...env.deletedNames];
    const warnCountAfterFirst = warnSpy.mock.calls.length;

    migrateSheets(options);

    expect(users.snapshot()).toEqual(snapshotAfterFirst);
    expect(users.writes.length).toBe(writeCountAfterFirst);
    expect(users.deletedColumns).toEqual(deletedColumnsAfterFirst);
    expect(env.deletedNames).toEqual(deletedNamesAfterFirst);
    expect(env.sheetNames()).toEqual(["User"]);
    expect(warnSpy.mock.calls.length).toBe(warnCountAfterFirst);
  });
});

describe("migrateSheets 既定の空シート削除", () => {
  test("空のシート1枚だけのスプレッドシートでは既定シートを削除する", () => {
    const env = makeSpreadsheet("active", [makeSheet("シート1", [])]);
    installSpreadsheetApp(env);

    migrateSheets({ models: [{ name: "User", columns: ["id", "name"] }] });

    expect(env.sheetNames()).toEqual(["User"]);
    expect(env.deletedNames).toEqual(["シート1"]);
    expect(env.handleOf("User").snapshot()).toEqual([["id", "name"]]);
    const logs = messagesOf(logSpy);
    expect(
      logs.some((log) => log.includes("deleted") && log.includes('"シート1"')),
    ).toBe(true);
  });

  test("削除した既定シートについては It is left untouched. を警告しない", () => {
    const env = makeSpreadsheet("active", [makeSheet("Sheet1", [])]);
    installSpreadsheetApp(env);

    migrateSheets({ models: [{ name: "User", columns: ["id"] }] });

    expect(env.deletedNames).toEqual(["Sheet1"]);
    expect(messagesOf(warnSpy)).toEqual([]);
  });

  test("名前がモデル名と一致する空シートは削除せずそのモデルのシートにする", () => {
    const env = makeSpreadsheet("active", [makeSheet("User", [])]);
    installSpreadsheetApp(env);

    migrateSheets({
      models: [
        { name: "User", columns: ["id", "name"] },
        { name: "Post", columns: ["id", "title"] },
      ],
    });

    expect(env.sheetNames()).toEqual(["User", "Post"]);
    expect(env.deletedNames).toEqual([]);
    expect(env.insertedNames).toEqual(["Post"]);
    expect(env.handleOf("User").snapshot()).toEqual([["id", "name"]]);
  });

  test("1枚でもデータがあるシートは削除しない", () => {
    const legacy = makeSheet("Legacy", [["a"], [1]]);
    const env = makeSpreadsheet("active", [legacy]);
    installSpreadsheetApp(env);

    migrateSheets({ models: [{ name: "User", columns: ["id"] }] });

    expect(env.sheetNames()).toEqual(["Legacy", "User"]);
    expect(env.deletedNames).toEqual([]);
    expect(legacy.snapshot()).toEqual([["a"], [1]]);
  });

  test("見出し行だけのシートも削除しない", () => {
    const env = makeSpreadsheet("active", [makeSheet("Legacy", [["a"]])]);
    installSpreadsheetApp(env);

    migrateSheets({ models: [{ name: "User", columns: ["id"] }] });

    expect(env.sheetNames()).toEqual(["Legacy", "User"]);
    expect(env.deletedNames).toEqual([]);
  });

  test("最終行だけが 0 でないシートは削除しない", () => {
    const env = makeSpreadsheet("active", [
      withExtents(makeSheet("シート1", []), 1, 0),
    ]);
    installSpreadsheetApp(env);

    migrateSheets({ models: [{ name: "User", columns: ["id"] }] });

    expect(env.sheetNames()).toEqual(["シート1", "User"]);
    expect(env.deletedNames).toEqual([]);
  });

  test("最終列だけが 0 でないシートは削除しない", () => {
    const env = makeSpreadsheet("active", [
      withExtents(makeSheet("シート1", []), 0, 1),
    ]);
    installSpreadsheetApp(env);

    migrateSheets({ models: [{ name: "User", columns: ["id"] }] });

    expect(env.sheetNames()).toEqual(["シート1", "User"]);
    expect(env.deletedNames).toEqual([]);
  });

  test("シートが2枚以上ある場合は空の1枚があっても削除しない", () => {
    const env = makeSpreadsheet("active", [
      makeSheet("シート1", []),
      makeSheet("Old", [["a"]]),
    ]);
    installSpreadsheetApp(env);

    migrateSheets({ models: [{ name: "User", columns: ["id"] }] });

    expect(env.sheetNames()).toEqual(["シート1", "Old", "User"]);
    expect(env.deletedNames).toEqual([]);
  });

  test("models が空配列なら最後の1枚になるので削除しない", () => {
    const env = makeSpreadsheet("active", [makeSheet("シート1", [])]);
    installSpreadsheetApp(env);

    migrateSheets({ models: [] });

    expect(env.sheetNames()).toEqual(["シート1"]);
    expect(env.deletedNames).toEqual([]);
  });

  [true, false].forEach((acceptDataLoss) => {
    test(`acceptDataLoss: ${acceptDataLoss} でも既定の空シートを削除する`, () => {
      const env = makeSpreadsheet("active", [makeSheet("シート1", [])]);
      installSpreadsheetApp(env);

      migrateSheets({
        models: [{ name: "User", columns: ["id"] }],
        acceptDataLoss,
      });

      expect(env.sheetNames()).toEqual(["User"]);
      expect(env.deletedNames).toEqual(["シート1"]);
    });

    test(`acceptDataLoss: ${acceptDataLoss} でも models が空配列なら削除しない`, () => {
      const env = makeSpreadsheet("active", [makeSheet("シート1", [])]);
      installSpreadsheetApp(env);

      migrateSheets({ models: [], acceptDataLoss });

      expect(env.sheetNames()).toEqual(["シート1"]);
      expect(env.deletedNames).toEqual([]);
    });
  });

  test("2回続けて実行しても2回目は削除も作成も起きない", () => {
    const env = makeSpreadsheet("active", [makeSheet("シート1", [])]);
    installSpreadsheetApp(env);
    const models = [{ name: "User", columns: ["id", "name"] }];

    migrateSheets({ models });
    const snapshotAfterFirst = env.handleOf("User").snapshot();
    const writeCountAfterFirst = env.handleOf("User").writes.length;

    migrateSheets({ models });

    expect(env.sheetNames()).toEqual(["User"]);
    expect(env.deletedNames).toEqual(["シート1"]);
    expect(env.insertedNames).toEqual(["User"]);
    expect(env.handleOf("User").snapshot()).toEqual(snapshotAfterFirst);
    expect(env.handleOf("User").writes.length).toBe(writeCountAfterFirst);
  });
});

describe("migrateSheets 引数の検証", () => {
  test("models が無い場合は GassmaMissingArgumentError を投げる", () => {
    installSpreadsheetApp(makeSpreadsheet("active", []));
    const callUnsafely: (options: unknown) => void = migrateSheets;

    expect(() => callUnsafely(undefined)).toThrow(GassmaMissingArgumentError);
    expect(() => callUnsafely({})).toThrow(GassmaMissingArgumentError);
  });
});

describe("migrateSheets スプレッドシートの解決", () => {
  test("spreadsheetId 指定時は openById のスプレッドシートへ適用する", () => {
    const active = makeSpreadsheet("active", []);
    const target = makeSpreadsheet("target", []);
    const { openByIdCalls } = installSpreadsheetApp(active, {
      "target-id": target,
    });

    migrateSheets({
      spreadsheetId: "target-id",
      models: [{ name: "User", columns: ["id"] }],
    });

    expect(openByIdCalls).toEqual(["target-id"]);
    expect(target.insertedNames).toEqual(["User"]);
    expect(active.insertedNames).toEqual([]);
  });

  test("spreadsheetId 未指定時はアクティブなスプレッドシートへ適用する", () => {
    const active = makeSpreadsheet("active", []);
    installSpreadsheetApp(active);

    migrateSheets({ models: [{ name: "User", columns: ["id"] }] });

    expect(active.insertedNames).toEqual(["User"]);
  });
});
