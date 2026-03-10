import { applyUpdatedAt } from "../../../util/defaults/applyUpdatedAt";

describe("applyUpdatedAt", () => {
  it("データにフィールドがない場合は現在時刻をセットする", () => {
    const before = new Date();
    const result = applyUpdatedAt({ name: "Alice" }, ["updatedAt"]);
    const after = new Date();

    expect(result).toHaveProperty("updatedAt");
    const ts = result.updatedAt as Date;
    expect(ts.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(ts.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it("データにフィールドが明示されている場合はそのまま返す", () => {
    const customDate = new Date("2020-01-01T00:00:00Z");
    const result = applyUpdatedAt({ name: "Alice", updatedAt: customDate }, [
      "updatedAt",
    ]);
    expect(result.updatedAt).toBe(customDate);
  });

  it("複数フィールドを同時に適用できる", () => {
    const before = new Date();
    const result = applyUpdatedAt({ name: "Alice" }, [
      "updatedAt",
      "modifiedAt",
    ]);
    const after = new Date();

    const ts1 = result.updatedAt as Date;
    const ts2 = result.modifiedAt as Date;
    expect(ts1.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(ts1.getTime()).toBeLessThanOrEqual(after.getTime());
    expect(ts2.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(ts2.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it("複数フィールドで一部が明示されている場合は未指定のみ適用", () => {
    const customDate = new Date("2020-01-01T00:00:00Z");
    const result = applyUpdatedAt({ name: "Alice", updatedAt: customDate }, [
      "updatedAt",
      "modifiedAt",
    ]);
    expect(result.updatedAt).toBe(customDate);
    expect(result.modifiedAt).toBeInstanceOf(Date);
  });

  it("元のデータオブジェクトを変更しない", () => {
    const data = { name: "Alice" };
    applyUpdatedAt(data, ["updatedAt"]);
    expect(data).toEqual({ name: "Alice" });
  });

  it("他のフィールドはそのまま保持される", () => {
    const result = applyUpdatedAt({ name: "Alice", role: "ADMIN" }, [
      "updatedAt",
    ]);
    expect(result.name).toBe("Alice");
    expect(result.role).toBe("ADMIN");
    expect(result).toHaveProperty("updatedAt");
  });
});
