import { applyDistinct } from "../../../../util/find/findUtil/applyDistinct";
import {
  createCrossRealmDate,
  createCrossRealmValue,
} from "../../../consts/crossRealm";

describe("applyDistinct", () => {
  test("should keep first occurrence for a single column", () => {
    const result = applyDistinct(
      [
        { id: 1, v: "a" },
        { id: 2, v: "b" },
        { id: 3, v: "a" },
      ],
      ["v"],
    );
    expect(result).toEqual([
      { id: 1, v: "a" },
      { id: 2, v: "b" },
    ]);
  });

  test("should accept a plain string as distinct key", () => {
    const result = applyDistinct([{ v: 1 }, { v: 1 }, { v: 2 }], "v");
    expect(result).toEqual([{ v: 1 }, { v: 2 }]);
  });

  test("should not collapse a Date with its ISO string", () => {
    const rows = [
      { id: 1, v: new Date("2024-01-01T00:00:00.000Z") },
      { id: 2, v: "2024-01-01T00:00:00.000Z" },
    ];
    expect(applyDistinct(rows, ["v"])).toEqual(rows);
  });

  test("should keep NaN, null, Invalid Date and numbers as separate rows", () => {
    const result = applyDistinct(
      [
        { id: 1, v: Number.NaN },
        { id: 2, v: null },
        { id: 3, v: new Date("invalid") },
        { id: 4, v: Number.NaN },
        { id: 5, v: 1 },
      ],
      ["v"],
    );
    expect(result.map((row) => row.id)).toEqual([1, 2, 3, 5]);
  });

  test("should collapse null rows together", () => {
    const result = applyDistinct(
      [
        { id: 1, v: null },
        { id: 2, v: null },
        { id: 3, v: 1 },
      ],
      ["v"],
    );
    expect(result.map((row) => row.id)).toEqual([1, 3]);
  });

  test("should not collapse a number with its string form", () => {
    const rows = [
      { id: 1, v: 1 },
      { id: 2, v: "1" },
    ];
    expect(applyDistinct(rows, ["v"])).toEqual(rows);
  });

  test("should collapse Invalid Date instances together", () => {
    const result = applyDistinct(
      [
        { id: 1, v: new Date("invalid") },
        { id: 2, v: new Date("nope") },
      ],
      ["v"],
    );
    expect(result.map((row) => row.id)).toEqual([1]);
  });

  test("should collapse Dates with the same time but different instances", () => {
    const result = applyDistinct(
      [
        { id: 1, v: new Date("2024-01-01T00:00:00.000Z") },
        { id: 2, v: new Date("2024-01-01T00:00:00.000Z") },
      ],
      ["v"],
    );
    expect(result.map((row) => row.id)).toEqual([1]);
  });

  describe("multiple columns", () => {
    test("should deduplicate on the combination of columns", () => {
      const result = applyDistinct(
        [
          { id: 1, a: "x", b: 1 },
          { id: 2, a: "x", b: 2 },
          { id: 3, a: "x", b: 1 },
          { id: 4, a: "y", b: 1 },
        ],
        ["a", "b"],
      );
      expect(result.map((row) => row.id)).toEqual([1, 2, 4]);
    });

    test("should not collide when a separator-like text sits in a column", () => {
      const rows = [
        { id: 1, a: "x|y", b: "" },
        { id: 2, a: "x", b: "y" },
      ];
      expect(applyDistinct(rows, ["a", "b"])).toEqual(rows);
    });

    test("should not collide when a column embeds another column's key text", () => {
      const rows = [
        { id: 1, a: "x|str:y", b: "" },
        { id: 2, a: "x", b: "y|str:" },
      ];
      expect(applyDistinct(rows, ["a", "b"])).toEqual(rows);
    });

    test("should not collide Date and ISO string inside a composite key", () => {
      const rows = [
        { id: 1, a: new Date("2024-01-01T00:00:00.000Z"), b: 1 },
        { id: 2, a: "2024-01-01T00:00:00.000Z", b: 1 },
      ];
      expect(applyDistinct(rows, ["a", "b"])).toEqual(rows);
    });
  });
});

describe("applyDistinct with cross-realm Dates", () => {
  test("should collapse a cross-realm Date with a same-realm Date of the same time", () => {
    const result = applyDistinct(
      [
        { id: 1, v: new Date("2024-01-01T00:00:00.000Z") },
        { id: 2, v: createCrossRealmDate("2024-01-01T00:00:00.000Z") },
      ],
      ["v"],
    );
    expect(result.map((row) => row.id)).toEqual([1]);
  });

  test("should collapse two cross-realm Dates with the same time", () => {
    const result = applyDistinct(
      [
        { id: 1, v: createCrossRealmDate("2024-01-01T00:00:00.000Z") },
        { id: 2, v: createCrossRealmDate("2024-01-01T00:00:00.000Z") },
      ],
      ["v"],
    );
    expect(result.map((row) => row.id)).toEqual([1]);
  });

  test("should keep cross-realm Dates with different times as separate rows", () => {
    const rows = [
      { id: 1, v: createCrossRealmDate("2024-01-01T00:00:00.000Z") },
      { id: 2, v: createCrossRealmDate("2024-01-02T00:00:00.000Z") },
    ];
    expect(applyDistinct(rows, ["v"]).map((row) => row.id)).toEqual([1, 2]);
  });

  test("should not collapse a cross-realm Date with its ISO string", () => {
    const rows = [
      { id: 1, v: createCrossRealmDate("2024-01-01T00:00:00.000Z") },
      { id: 2, v: "2024-01-01T00:00:00.000Z" },
    ];
    expect(applyDistinct(rows, ["v"])).toEqual(rows);
  });

  test("should collapse a cross-realm Invalid Date with a same-realm Invalid Date", () => {
    const result = applyDistinct(
      [
        { id: 1, v: new Date("invalid") },
        { id: 2, v: createCrossRealmValue<Date>('new Date("nope")') },
      ],
      ["v"],
    );
    expect(result.map((row) => row.id)).toEqual([1]);
  });
});
