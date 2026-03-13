import { generateAutoincrementValues } from "../../../util/defaults/generateAutoincrementValues";

describe("generateAutoincrementValues", () => {
  const mockReleaseLock = jest.fn();
  const mockWaitLock = jest.fn();
  const mockGetProperty = jest.fn();
  const mockSetProperty = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (globalThis as Record<string, unknown>).LockService = {
      getScriptLock: () => ({
        waitLock: mockWaitLock,
        releaseLock: mockReleaseLock,
      }),
    };

    (globalThis as Record<string, unknown>).PropertiesService = {
      getScriptProperties: () => ({
        getProperty: mockGetProperty,
        setProperty: mockSetProperty,
      }),
    };
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).LockService;
    delete (globalThis as Record<string, unknown>).PropertiesService;
  });

  it("初回はカウンター1を返す", () => {
    mockGetProperty.mockReturnValue(null);
    const result = generateAutoincrementValues(["id"], "sheet1_Users");
    expect(result).toEqual({ id: 1 });
    expect(mockSetProperty).toHaveBeenCalledWith(
      "gassma_autoincrement_sheet1_Users_id",
      "1",
    );
  });

  it("既存カウンターから続きの値を返す", () => {
    mockGetProperty.mockReturnValue("5");
    const result = generateAutoincrementValues(["id"], "sheet1_Users");
    expect(result).toEqual({ id: 6 });
    expect(mockSetProperty).toHaveBeenCalledWith(
      "gassma_autoincrement_sheet1_Users_id",
      "6",
    );
  });

  it("複数フィールドそれぞれにカウンターを持つ", () => {
    mockGetProperty.mockReturnValueOnce("3").mockReturnValueOnce("10");
    const result = generateAutoincrementValues(["id", "seq"], "sheet1_Users");
    expect(result).toEqual({ id: 4, seq: 11 });
  });

  it("count指定で複数行分のカウンターを一括確保する", () => {
    mockGetProperty.mockReturnValue("5");
    const result = generateAutoincrementValues(["id"], "sheet1_Users", 3);
    expect(result).toEqual({ id: [6, 7, 8] });
    expect(mockSetProperty).toHaveBeenCalledWith(
      "gassma_autoincrement_sheet1_Users_id",
      "8",
    );
  });

  it("ロックを取得して解放する", () => {
    mockGetProperty.mockReturnValue(null);
    generateAutoincrementValues(["id"], "sheet1_Users");
    expect(mockWaitLock).toHaveBeenCalledWith(10000);
    expect(mockReleaseLock).toHaveBeenCalled();
  });

  it("エラー時でもロックを解放する", () => {
    mockGetProperty.mockImplementation(() => {
      throw new Error("test error");
    });
    expect(() => generateAutoincrementValues(["id"], "sheet1_Users")).toThrow(
      "test error",
    );
    expect(mockReleaseLock).toHaveBeenCalled();
  });
});
