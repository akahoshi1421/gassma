import { applyAutoincrement } from "../../../util/defaults/applyAutoincrement";

describe("applyAutoincrement", () => {
  it("指定フィールドにカウンター値を設定する", () => {
    const data = { name: "Alice" };
    const result = applyAutoincrement(data, ["id"], { id: 1 });
    expect(result).toEqual({ id: 1, name: "Alice" });
  });

  it("複数フィールドにそれぞれのカウンター値を設定する", () => {
    const data = { name: "Alice" };
    const result = applyAutoincrement(data, ["id", "seq"], { id: 5, seq: 10 });
    expect(result).toEqual({ id: 5, seq: 10, name: "Alice" });
  });

  it("明示的に値が設定されている場合はスキップする", () => {
    const data = { id: 99, name: "Alice" };
    const result = applyAutoincrement(data, ["id"], { id: 1 });
    expect(result).toEqual({ id: 99, name: "Alice" });
  });

  it("元のデータオブジェクトを変更しない", () => {
    const data = { name: "Alice" };
    applyAutoincrement(data, ["id"], { id: 1 });
    expect(data).toEqual({ name: "Alice" });
  });

  it("フィールドリストが空なら何も追加しない", () => {
    const data = { name: "Alice" };
    const result = applyAutoincrement(data, [], {});
    expect(result).toEqual({ name: "Alice" });
  });
});
