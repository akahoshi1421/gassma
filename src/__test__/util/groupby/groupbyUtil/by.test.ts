import { byClassification } from "../../../../util/groupby/groubyUtil/by";
import {
  createCrossRealmDate,
  createCrossRealmValue,
} from "../../../consts/crossRealm";

describe("byClassification with Date values", () => {
  test("同時刻・別インスタンスのDateは同一グループになる", () => {
    const rows = [
      { at: new Date("2026-07-18T09:30:00.000Z"), v: 1 },
      { at: new Date("2026-07-18T09:30:00.000Z"), v: 2 },
    ];

    const result = byClassification(rows, ["at"]);

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveLength(2);
  });

  test("ミリ秒差のDateは別グループになる", () => {
    const rows = [
      { at: new Date("2026-07-18T09:30:00.000Z"), v: 1 },
      { at: new Date("2026-07-18T09:30:00.001Z"), v: 2 },
    ];

    const result = byClassification(rows, ["at"]);

    expect(result).toHaveLength(2);
  });

  test("DateとISO文字列は別グループになる", () => {
    const rows = [
      { at: new Date("2026-07-18T09:30:00.000Z"), v: 1 },
      { at: "2026-07-18T09:30:00.000Z", v: 2 },
    ];

    const result = byClassification(rows, ["at"]);

    expect(result).toHaveLength(2);
  });

  test("複数キーでもDateキーは時刻一致でグループ化される", () => {
    const rows = [
      { at: new Date("2026-07-18T09:30:00.000Z"), city: "Tokyo" },
      { at: new Date("2026-07-18T09:30:00.000Z"), city: "Tokyo" },
      { at: new Date("2026-07-18T09:30:00.000Z"), city: "Osaka" },
    ];

    const result = byClassification(rows, ["at", "city"]);

    expect(result).toHaveLength(2);
  });

  test("非Date値のグループ化は従来どおり", () => {
    const rows = [{ city: "Tokyo" }, { city: "Osaka" }, { city: "Tokyo" }];

    const result = byClassification(rows, ["city"]);

    expect(result).toHaveLength(2);
    expect(result[0]).toHaveLength(2);
  });

  test("クロスrealmのDateも同時刻なら同一グループになる", () => {
    const rows = [
      { at: new Date("2026-07-18T09:30:00.000Z"), v: 1 },
      { at: createCrossRealmDate("2026-07-18T09:30:00.000Z"), v: 2 },
    ];

    const result = byClassification(rows, ["at"]);

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveLength(2);
  });

  test("クロスrealmのDate同士も同時刻なら同一グループになる", () => {
    const rows = [
      { at: createCrossRealmDate("2026-07-18T09:30:00.000Z"), v: 1 },
      { at: createCrossRealmDate("2026-07-18T09:30:00.000Z"), v: 2 },
    ];

    const result = byClassification(rows, ["at"]);

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveLength(2);
  });

  test("クロスrealmのDateとミリ秒差のDateは別グループになる", () => {
    const rows = [
      { at: createCrossRealmDate("2026-07-18T09:30:00.000Z"), v: 1 },
      { at: new Date("2026-07-18T09:30:00.001Z"), v: 2 },
    ];

    const result = byClassification(rows, ["at"]);

    expect(result).toHaveLength(2);
  });

  test("クロスrealmのDateとISO文字列は別グループになる", () => {
    const rows = [
      { at: createCrossRealmDate("2026-07-18T09:30:00.000Z"), v: 1 },
      { at: "2026-07-18T09:30:00.000Z", v: 2 },
    ];

    const result = byClassification(rows, ["at"]);

    expect(result).toHaveLength(2);
  });

  test("クロスrealmのInvalid Dateは同一realmのInvalid Dateと同一グループになる", () => {
    const rows = [
      { at: new Date("invalid"), v: 1 },
      { at: createCrossRealmValue<Date>('new Date("nope")'), v: 2 },
    ];

    const result = byClassification(rows, ["at"]);

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveLength(2);
  });

  test("クロスrealmのInvalid Dateは有効なDateとは別グループになる", () => {
    const rows = [
      { at: createCrossRealmValue<Date>('new Date("nope")'), v: 1 },
      { at: new Date("2026-07-18T09:30:00.000Z"), v: 2 },
    ];

    const result = byClassification(rows, ["at"]);

    expect(result).toHaveLength(2);
  });
});
