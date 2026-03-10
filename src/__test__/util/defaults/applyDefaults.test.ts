import { applyDefaults } from "../../../util/defaults/applyDefaults";

describe("applyDefaults", () => {
  it("データにないフィールドに静的デフォルト値を適用する", () => {
    const data = { name: "Alice" };
    const defaults = { role: "USER" };
    const result = applyDefaults(data, defaults);
    expect(result).toEqual({ name: "Alice", role: "USER" });
  });

  it("データにないフィールドに関数デフォルト値を適用する", () => {
    const data = { name: "Alice" };
    const defaults = { createdAt: () => "2026-01-01" };
    const result = applyDefaults(data, defaults);
    expect(result).toEqual({ name: "Alice", createdAt: "2026-01-01" });
  });

  it("データに既に存在するフィールドはデフォルトで上書きしない", () => {
    const data = { name: "Alice", role: "ADMIN" };
    const defaults = { role: "USER" };
    const result = applyDefaults(data, defaults);
    expect(result).toEqual({ name: "Alice", role: "ADMIN" });
  });

  it("データにnullが明示されている場合はデフォルトを適用しない", () => {
    const data = { name: "Alice", role: null };
    const defaults = { role: "USER" };
    const result = applyDefaults(data, defaults);
    expect(result).toEqual({ name: "Alice", role: null });
  });

  it("複数のデフォルト値を同時に適用できる", () => {
    const data = { name: "Alice" };
    const defaults = { role: "USER", active: true, score: 0 };
    const result = applyDefaults(data, defaults);
    expect(result).toEqual({
      name: "Alice",
      role: "USER",
      active: true,
      score: 0,
    });
  });

  it("デフォルト値が空の場合は元のデータをそのまま返す", () => {
    const data = { name: "Alice" };
    const defaults = {};
    const result = applyDefaults(data, defaults);
    expect(result).toEqual({ name: "Alice" });
  });

  it("関数デフォルトは呼び出しごとに評価される", () => {
    let count = 0;
    const defaults = {
      id: () => {
        count += 1;
        return count;
      },
    };

    const r1 = applyDefaults({ name: "A" }, defaults);
    const r2 = applyDefaults({ name: "B" }, defaults);
    expect(r1).toEqual({ name: "A", id: 1 });
    expect(r2).toEqual({ name: "B", id: 2 });
  });

  it("元のデータオブジェクトを変更しない", () => {
    const data = { name: "Alice" };
    const defaults = { role: "USER" };
    applyDefaults(data, defaults);
    expect(data).toEqual({ name: "Alice" });
  });
});
