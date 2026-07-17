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
