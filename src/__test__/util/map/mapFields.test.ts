import { mapToSheet, mapFromSheet } from "../../../util/map/mapFields";

describe("mapToSheet", () => {
  it("コード名をシートヘッダー名に変換する", () => {
    const data = { firstName: "Alice", age: 20 };
    const mapping = { firstName: "名前" };
    const result = mapToSheet(data, mapping);
    expect(result).toEqual({ 名前: "Alice", age: 20 });
  });

  it("複数のマッピングを同時に変換する", () => {
    const data = { firstName: "Alice", lastName: "Smith" };
    const mapping = { firstName: "名前", lastName: "名字" };
    const result = mapToSheet(data, mapping);
    expect(result).toEqual({ 名前: "Alice", 名字: "Smith" });
  });

  it("マッピングにないフィールドはそのまま保持する", () => {
    const data = { firstName: "Alice", role: "ADMIN" };
    const mapping = { firstName: "名前" };
    const result = mapToSheet(data, mapping);
    expect(result).toEqual({ 名前: "Alice", role: "ADMIN" });
  });

  it("空のマッピングならそのまま返す", () => {
    const data = { firstName: "Alice" };
    const result = mapToSheet(data, {});
    expect(result).toEqual({ firstName: "Alice" });
  });

  it("元のデータオブジェクトを変更しない", () => {
    const data = { firstName: "Alice" };
    mapToSheet(data, { firstName: "名前" });
    expect(data).toEqual({ firstName: "Alice" });
  });
});

describe("mapFromSheet", () => {
  it("シートヘッダー名をコード名に変換する", () => {
    const data = { 名前: "Alice", age: 20 };
    const mapping = { firstName: "名前" };
    const result = mapFromSheet(data, mapping);
    expect(result).toEqual({ firstName: "Alice", age: 20 });
  });

  it("複数のマッピングを同時に変換する", () => {
    const data = { 名前: "Alice", 名字: "Smith" };
    const mapping = { firstName: "名前", lastName: "名字" };
    const result = mapFromSheet(data, mapping);
    expect(result).toEqual({ firstName: "Alice", lastName: "Smith" });
  });

  it("マッピングにないフィールドはそのまま保持する", () => {
    const data = { 名前: "Alice", role: "ADMIN" };
    const mapping = { firstName: "名前" };
    const result = mapFromSheet(data, mapping);
    expect(result).toEqual({ firstName: "Alice", role: "ADMIN" });
  });

  it("元のデータオブジェクトを変更しない", () => {
    const data = { 名前: "Alice" };
    mapFromSheet(data, { firstName: "名前" });
    expect(data).toEqual({ 名前: "Alice" });
  });
});
