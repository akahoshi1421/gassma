import { getCount } from "../../../../util/aggregate/aggregateUtil/count";

describe("getCount", () => {
  test("should count non-null values for each field", () => {
    const rows = [
      { age: 10, score: 80 },
      { age: 20, score: 90 },
      { age: 30, score: 70 },
    ];
    const result = getCount(rows, { age: true, score: true });

    expect(result).toEqual({
      age: 3,
      score: 3,
    });
  });

  test("should exclude null and undefined values from count", () => {
    const rows = [
      { age: 10, score: null },
      { age: null, score: 80 },
      { age: 30, score: undefined },
    ];
    const result = getCount(rows, { age: true, score: true });

    expect(result).toEqual({
      age: 2,
      score: 1,
    });
  });

  test("should return 0 for empty rows array", () => {
    const rows: any[] = [];
    const result = getCount(rows, { age: true });

    expect(result).toEqual({
      age: 0,
    });
  });

  test("should return 0 for fields where all values are null", () => {
    const rows = [
      { age: null, score: 80 },
      { age: null, score: 90 },
    ];
    const result = getCount(rows, { age: true, score: true });

    expect(result).toEqual({
      age: 0,
      score: 2,
    });
  });

  test("should exclude NaN and Invalid Date from field counts like null", () => {
    const rows = [
      { age: 10, at: new Date(1700000000000) },
      { age: NaN, at: new Date("invalid") },
      { age: 30, at: new Date("invalid") },
    ];
    const result = getCount(rows, { age: true, at: true });

    expect(result).toEqual({
      age: 2,
      at: 1,
    });
  });

  test("should count NaN rows in _all", () => {
    const rows = [{ age: 10 }, { age: NaN }];
    const result = getCount(rows, { _all: true, age: true });

    expect(result).toEqual({ _all: 2, age: 1 });
  });

  test("should count zero and false as valid values", () => {
    const rows = [
      { num: 0, flag: false },
      { num: 0, flag: false },
    ];
    const result = getCount(rows, { num: true, flag: true });

    expect(result).toEqual({
      num: 2,
      flag: 2,
    });
  });
});

describe("getCount with _all", () => {
  test("should count all rows including rows with null values", () => {
    const rows = [
      { cat: "a", memo: "m1" },
      { cat: "a", memo: null },
      { cat: "b", memo: "m2" },
    ];
    const result = getCount(rows, { _all: true });

    expect(result).toEqual({ _all: 3 });
  });

  test("should count all rows even when every value in every column is null", () => {
    const rows = [{ memo: null }, { memo: null }, { memo: null }];
    const result = getCount(rows, { _all: true });

    expect(result).toEqual({ _all: 3 });
  });

  test("should return 0 for _all with empty rows", () => {
    const rows: any[] = [];
    const result = getCount(rows, { _all: true });

    expect(result).toEqual({ _all: 0 });
  });

  test("should handle _all mixed with field counts", () => {
    const rows = [
      { cat: "a", memo: "m1" },
      { cat: "a", memo: null },
      { cat: "b", memo: "m2" },
    ];
    const result = getCount(rows, { _all: true, memo: true });

    expect(result).toEqual({ _all: 3, memo: 2 });
  });
});

describe("getCount with true shorthand", () => {
  test("should return total row count as a number", () => {
    const rows = [
      { cat: "a", memo: "m1" },
      { cat: "a", memo: null },
      { cat: "b", memo: "m2" },
    ];
    const result = getCount(rows, true);

    expect(result).toBe(3);
  });

  test("should return 0 as a number for empty rows", () => {
    const rows: any[] = [];
    const result = getCount(rows, true);

    expect(result).toBe(0);
  });
});
