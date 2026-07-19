import { GassmaController } from "../../../gassmaController";
import { upsertFunc } from "../../../util/upsert/upsert";
import { getMutableMockControllerUtil } from "../../consts/mockControllerUtil";

describe("upsertFunc の prepareCreate", () => {
  let mockUtil: ReturnType<typeof getMutableMockControllerUtil>;

  beforeEach(() => {
    mockUtil = getMutableMockControllerUtil();
    mockUtil.sheet._resetMockData();
  });

  test("create 分岐では prepareCreate が create データに適用される", () => {
    const prepareCreate = jest.fn((data: Record<string, unknown>) => ({
      ...data,
      職業: "Prepared",
    }));
    const result = upsertFunc(
      mockUtil,
      {
        where: { 名前: "NewPerson" },
        create: {
          名前: "NewPerson",
          年齢: 40,
          住所: "Fukuoka",
          郵便番号: "810-0001",
          職業: "Artist",
        },
        update: { 職業: "Updated Artist" },
      },
      null,
      prepareCreate,
    );

    expect(prepareCreate).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      名前: "NewPerson",
      年齢: 40,
      住所: "Fukuoka",
      郵便番号: "810-0001",
      職業: "Prepared",
    });
  });

  test("update 分岐では prepareCreate が呼ばれない", () => {
    const prepareCreate = jest.fn((data: Record<string, unknown>) => data);
    upsertFunc(
      mockUtil,
      {
        where: { 名前: "Alice" },
        create: {
          名前: "Alice",
          年齢: 28,
          住所: "Tokyo",
          郵便番号: "100-0001",
          職業: "Engineer",
        },
        update: { 職業: "Tech Lead" },
      },
      null,
      prepareCreate,
    );

    expect(prepareCreate).not.toHaveBeenCalled();
  });

  test("prepareCreate 未指定なら create データがそのまま使われる", () => {
    const result = upsertFunc(mockUtil, {
      where: { 名前: "NewPerson" },
      create: {
        名前: "NewPerson",
        年齢: 40,
        住所: "Fukuoka",
        郵便番号: "810-0001",
        職業: "Artist",
      },
      update: { 職業: "Updated Artist" },
    });

    expect(result).toEqual({
      名前: "NewPerson",
      年齢: 40,
      住所: "Fukuoka",
      郵便番号: "810-0001",
      職業: "Artist",
    });
  });
});

type MockRange = {
  getValues: () => unknown[][];
  setValues: (values: unknown[][]) => void;
};

type MockSheet = {
  getName: () => string;
  getLastRow: () => number;
  getLastColumn: () => number;
  getRange: (
    row: number,
    col: number,
    numRows: number,
    numCols: number,
  ) => MockRange;
  getDataRange: () => { getValues: () => unknown[][] };
  deleteRow: (rowIndex: number) => void;
};

const makeSheet = (name: string, initial: unknown[][]): MockSheet => {
  const data = initial.map((row) => [...row]);
  return {
    getName: () => name,
    getLastRow: () => data.length,
    getLastColumn: () => data[0].length,
    getRange: (row, col, numRows, numCols) => ({
      getValues: () =>
        data
          .slice(row - 1, row - 1 + numRows)
          .map((r) => r.slice(col - 1, col - 1 + numCols)),
      setValues: (values) => {
        values.forEach((rowValues, i) => {
          while (data.length < row + i) {
            data.push(Array(data[0].length).fill(""));
          }
          rowValues.forEach((value, j) => {
            data[row - 1 + i][col - 1 + j] = value;
          });
        });
      },
    }),
    getDataRange: () => ({ getValues: () => data }),
    deleteRow: (rowIndex) => {
      data.splice(rowIndex - 1, 1);
    },
  };
};

const COUNTER_KEY = "gassma_autoincrement_test-ss_Users_id";

describe("GassmaController.upsert の autoincrement", () => {
  const mockWaitLock = jest.fn();
  const mockReleaseLock = jest.fn();
  let propsStore: Record<string, string>;
  const mockGetProperty = jest.fn(
    (key: string): string | null => propsStore[key] ?? null,
  );
  const mockSetProperty = jest.fn((key: string, value: string) => {
    propsStore[key] = value;
  });

  const buildController = (withAutoincrement: boolean): GassmaController => {
    const sheet = makeSheet("Users", [
      ["id", "name", "job"],
      [1, "Alice", "Engineer"],
    ]);
    const mockSpreadsheet = {
      getId: () => "test-ss",
      getSheets: () => [sheet],
      getSheetByName: (n: string) => (n === "Users" ? sheet : null),
    };
    Object.assign(globalThis, {
      SpreadsheetApp: { getActiveSpreadsheet: () => mockSpreadsheet },
    });
    const controller = new GassmaController("Users");
    if (withAutoincrement) controller._setAutoincrement(["id"]);
    return controller;
  };

  beforeEach(() => {
    propsStore = { [COUNTER_KEY]: "1" };
    Object.assign(globalThis, {
      LockService: {
        getScriptLock: () => ({
          waitLock: mockWaitLock,
          releaseLock: mockReleaseLock,
        }),
      },
      PropertiesService: {
        getScriptProperties: () => ({
          getProperty: mockGetProperty,
          setProperty: mockSetProperty,
        }),
      },
    });
  });

  afterAll(() => {
    Object.assign(globalThis, {
      SpreadsheetApp: undefined,
      LockService: undefined,
      PropertiesService: undefined,
    });
  });

  test("create 経路で autoincrement 列が採番される", () => {
    const controller = buildController(true);
    const result = controller.upsert({
      where: { name: "Bob" },
      create: { name: "Bob", job: "Designer" },
      update: { job: "Never" },
    });
    expect(result).toEqual({ id: 2, name: "Bob", job: "Designer" });
    expect(propsStore[COUNTER_KEY]).toBe("2");
  });

  test("採番された値がシートに書き込まれる", () => {
    const controller = buildController(true);
    controller.upsert({
      where: { name: "Bob" },
      create: { name: "Bob", job: "Designer" },
      update: { job: "Never" },
    });
    const found = controller.findMany({ where: { name: "Bob" } });
    expect(found).toEqual([{ id: 2, name: "Bob", job: "Designer" }]);
  });

  test("create 経路が連続するとカウンタが進む", () => {
    const controller = buildController(true);
    controller.upsert({
      where: { name: "Bob" },
      create: { name: "Bob", job: "Designer" },
      update: { job: "Never" },
    });
    const second = controller.upsert({
      where: { name: "Carol" },
      create: { name: "Carol", job: "PM" },
      update: { job: "Never" },
    });
    expect(second).toEqual({ id: 3, name: "Carol", job: "PM" });
    expect(propsStore[COUNTER_KEY]).toBe("3");
  });

  test("create に明示値がある列は採番値で上書きしない", () => {
    const controller = buildController(true);
    const result = controller.upsert({
      where: { name: "Carol" },
      create: { id: 100, name: "Carol", job: "PM" },
      update: { job: "Never" },
    });
    expect(result).toEqual({ id: 100, name: "Carol", job: "PM" });
  });

  test("update 経路では採番されず Lock/Properties にも触れない", () => {
    const controller = buildController(true);
    const result = controller.upsert({
      where: { name: "Alice" },
      create: { name: "Alice", job: "Never" },
      update: { job: "Tech Lead" },
    });
    expect(result).toEqual({ id: 1, name: "Alice", job: "Tech Lead" });
    expect(mockWaitLock).not.toHaveBeenCalled();
    expect(mockGetProperty).not.toHaveBeenCalled();
    expect(mockSetProperty).not.toHaveBeenCalled();
    expect(propsStore[COUNTER_KEY]).toBe("1");
  });

  test("autoincrement 未設定なら create 経路でも Lock/Properties に触れない", () => {
    const controller = buildController(false);
    const result = controller.upsert({
      where: { name: "Bob" },
      create: { id: 9, name: "Bob", job: "Designer" },
      update: { job: "Never" },
    });
    expect(result).toEqual({ id: 9, name: "Bob", job: "Designer" });
    expect(mockWaitLock).not.toHaveBeenCalled();
    expect(mockGetProperty).not.toHaveBeenCalled();
    expect(mockSetProperty).not.toHaveBeenCalled();
  });
});
