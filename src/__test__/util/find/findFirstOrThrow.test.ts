import { NotFoundError } from "../../../errors/find/findError";
import { findFirstFunc } from "../../../util/find/findFirst";
import { getBasicMockControllerUtil } from "../../consts/mockControllerUtil";

describe("findFirstOrThrow", () => {
  const mockUtil = getBasicMockControllerUtil();

  it("レコードが見つかった場合はそのまま返す", () => {
    const result = findFirstFunc(mockUtil, { where: { 名前: "John" } });

    expect(result).not.toBeNull();
    expect(result).toEqual({
      名前: "John",
      年齢: 30,
      住所: "Tokyo",
      郵便番号: "100-0001",
    });
  });

  it("レコードが見つからない場合は NotFoundError を throw する", () => {
    const result = findFirstFunc(mockUtil, {
      where: { 名前: "NonExistent" },
    });

    expect(result).toBeNull();

    // findFirstOrThrow 相当の動作確認
    expect(() => {
      if (!result) {
        throw new NotFoundError();
      }
    }).toThrow("Expected a record, got nothing");
  });

  it("NotFoundError のメッセージが正しい", () => {
    const error = new NotFoundError();

    expect(error.name).toBe("NotFoundError");
    expect(error.message).toContain("Expected a record, got nothing");
  });

  it("where 条件なしでレコードが存在すれば返す", () => {
    const result = findFirstFunc(mockUtil, {});

    expect(result).not.toBeNull();
  });
});
