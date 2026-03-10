import { applyUpdatedAt } from "../../../util/defaults/applyUpdatedAt";

describe("applyUpdatedAt", () => {
  it("データに updatedAt フィールドがない場合は現在時刻をセットする", () => {
    const before = new Date();
    const result = applyUpdatedAt({ name: "Alice" }, "updatedAt");
    const after = new Date();

    expect(result).toHaveProperty("updatedAt");
    const ts = result.updatedAt as Date;
    expect(ts.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(ts.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it("データに updatedAt フィールドが明示されている場合はそのまま返す", () => {
    const customDate = new Date("2020-01-01T00:00:00Z");
    const result = applyUpdatedAt(
      { name: "Alice", updatedAt: customDate },
      "updatedAt",
    );
    expect(result.updatedAt).toBe(customDate);
  });

  it("任意のフィールド名を指定できる", () => {
    const result = applyUpdatedAt({ name: "Alice" }, "modifiedAt");
    expect(result).toHaveProperty("modifiedAt");
    expect(result.modifiedAt).toBeInstanceOf(Date);
  });

  it("元のデータオブジェクトを変更しない", () => {
    const data = { name: "Alice" };
    applyUpdatedAt(data, "updatedAt");
    expect(data).toEqual({ name: "Alice" });
  });

  it("他のフィールドはそのまま保持される", () => {
    const result = applyUpdatedAt(
      { name: "Alice", role: "ADMIN" },
      "updatedAt",
    );
    expect(result.name).toBe("Alice");
    expect(result.role).toBe("ADMIN");
    expect(result).toHaveProperty("updatedAt");
  });
});
