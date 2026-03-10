import { stripIgnoredFields } from "../../../util/ignore/stripIgnoredFields";

describe("stripIgnoredFields", () => {
  it("指定フィールドをデータから除外する", () => {
    const data = { name: "Alice", secret: "hidden", role: "ADMIN" };
    const result = stripIgnoredFields(data, ["secret"]);
    expect(result).toEqual({ name: "Alice", role: "ADMIN" });
  });

  it("複数フィールドを同時に除外できる", () => {
    const data = {
      name: "Alice",
      secret: "hidden",
      internal: 123,
      role: "ADMIN",
    };
    const result = stripIgnoredFields(data, ["secret", "internal"]);
    expect(result).toEqual({ name: "Alice", role: "ADMIN" });
  });

  it("指定フィールドがデータに存在しない場合はそのまま返す", () => {
    const data = { name: "Alice", role: "ADMIN" };
    const result = stripIgnoredFields(data, ["secret"]);
    expect(result).toEqual({ name: "Alice", role: "ADMIN" });
  });

  it("空の ignore リストの場合はそのまま返す", () => {
    const data = { name: "Alice" };
    const result = stripIgnoredFields(data, []);
    expect(result).toEqual({ name: "Alice" });
  });

  it("元のデータオブジェクトを変更しない", () => {
    const data = { name: "Alice", secret: "hidden" };
    stripIgnoredFields(data, ["secret"]);
    expect(data).toEqual({ name: "Alice", secret: "hidden" });
  });
});
