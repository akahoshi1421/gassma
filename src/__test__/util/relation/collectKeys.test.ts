import {
  createCrossRealmDate,
  createCrossRealmValue,
} from "../../consts/crossRealm";
import { collectKeys, isGassmaAny } from "../../../util/relation/collectKeys";

describe("collectKeys", () => {
  it("指定フィールドの値を収集する", () => {
    const records = [{ id: 1 }, { id: 2 }, { id: 3 }];
    expect(collectKeys(records, "id")).toEqual([1, 2, 3]);
  });

  it("null を除外する", () => {
    const records = [{ id: 1 }, { id: null }, { id: 3 }];
    expect(collectKeys(records, "id")).toEqual([1, 3]);
  });

  it("全て null の場合は空配列を返す", () => {
    const records = [{ id: null }, { id: null }];
    expect(collectKeys(records, "id")).toEqual([]);
  });

  it("undefined のフィールドも除外する", () => {
    const records = [{ id: 1 }, { name: "田中" }, { id: 3 }];
    expect(collectKeys(records, "id")).toEqual([1, 3]);
  });

  it("文字列・boolean・Date も収集できる", () => {
    const date = new Date("2026-01-01");
    const records = [{ key: "abc" }, { key: true }, { key: date }];
    expect(collectKeys(records, "key")).toEqual(["abc", true, date]);
  });
});

describe("isGassmaAny", () => {
  it("string を true と判定する", () => {
    expect(isGassmaAny("hello")).toBe(true);
  });

  it("number を true と判定する", () => {
    expect(isGassmaAny(42)).toBe(true);
  });

  it("boolean を true と判定する", () => {
    expect(isGassmaAny(false)).toBe(true);
  });

  it("Date を true と判定する", () => {
    expect(isGassmaAny(new Date())).toBe(true);
  });

  it("null を false と判定する", () => {
    expect(isGassmaAny(null)).toBe(false);
  });

  it("undefined を false と判定する", () => {
    expect(isGassmaAny(undefined)).toBe(false);
  });

  it("オブジェクトを false と判定する", () => {
    expect(isGassmaAny({ key: "value" })).toBe(false);
  });

  it("配列を false と判定する", () => {
    expect(isGassmaAny([1, 2, 3])).toBe(false);
  });
});

describe("クロス realm の値", () => {
  it("別 realm の Date を true と判定する", () => {
    const crossDate = createCrossRealmDate("2026-07-18T09:30:00.000Z");
    expect(crossDate instanceof Date).toBe(false);
    expect(isGassmaAny(crossDate)).toBe(true);
  });

  it("別 realm のオブジェクトを false と判定する", () => {
    const crossObject =
      createCrossRealmValue<Record<string, unknown>>('{ key: "value" }');
    expect(isGassmaAny(crossObject)).toBe(false);
  });

  it("別 realm の Date も収集できる", () => {
    const crossDate = createCrossRealmDate("2026-07-18T09:30:00.000Z");
    const records = [{ key: 1 }, { key: crossDate }, { key: null }];
    expect(collectKeys(records, "key")).toEqual([1, crossDate]);
  });
});
