import {
  collectWhereFieldKeys,
  hasTopLevelEmptyString,
} from "../../../../../util/create/nestedWrite/connectBatch/whereScan";
import { FieldRef } from "../../../../../util/filterConditions/fieldRef";

describe("collectWhereFieldKeys", () => {
  it("トップレベルの通常キーを収集する", () => {
    const keys = collectWhereFieldKeys({ id: 1, name: "a" });
    expect(keys).toEqual(new Set(["id", "name"]));
  });

  it("AND/OR/NOT は自身を収集せず中身へ再帰する", () => {
    const keys = collectWhereFieldKeys({
      AND: [{ a: 1 }, { OR: [{ b: 2 }] }],
      NOT: { c: 3 },
    });
    expect(keys).toEqual(new Set(["a", "b", "c"]));
  });

  it("AND が単一オブジェクトでも再帰する", () => {
    const keys = collectWhereFieldKeys({ AND: { a: 1 } });
    expect(keys).toEqual(new Set(["a"]));
  });

  it("フィルタ条件の演算子キーは収集しない", () => {
    const keys = collectWhereFieldKeys({ age: { gt: 5, lte: 10 } });
    expect(keys).toEqual(new Set(["age"]));
  });

  it("FieldRef の参照カラム名を収集する", () => {
    const keys = collectWhereFieldKeys({
      score: { gt: new FieldRef("Model", "limit") },
    });
    expect(keys).toEqual(new Set(["score", "limit"]));
  });

  it("配列の中の FieldRef も収集する", () => {
    const keys = collectWhereFieldKeys({
      tags: { in: [new FieldRef("Model", "x"), "y"] },
    });
    expect(keys).toEqual(new Set(["tags", "x"]));
  });

  it("空 where は空集合を返す", () => {
    expect(collectWhereFieldKeys({})).toEqual(new Set());
  });
});

describe("hasTopLevelEmptyString", () => {
  it("トップレベルの空文字値を検出する", () => {
    expect(hasTopLevelEmptyString({ name: "" })).toBe(true);
  });

  it("null や非空文字は検出しない", () => {
    expect(hasTopLevelEmptyString({ name: null, age: 0, id: "a" })).toBe(false);
  });

  it("フィルタ条件内の空文字は対象外", () => {
    expect(hasTopLevelEmptyString({ name: { equals: "" } })).toBe(false);
  });

  it("AND/OR/NOT 配下の空文字は対象外", () => {
    expect(hasTopLevelEmptyString({ AND: [{ name: "" }] })).toBe(false);
  });
});
