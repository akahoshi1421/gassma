import { getMax } from "../../../../util/aggregate/aggregateUtil/max";
import { getBooleanMax } from "../../../../util/aggregate/aggregateUtil/max/booleanMax";
import { getDateMax } from "../../../../util/aggregate/aggregateUtil/max/dateMax";
import { getStringMax } from "../../../../util/aggregate/aggregateUtil/max/stringMax";
import { getMin } from "../../../../util/aggregate/aggregateUtil/min";
import { getBooleanMin } from "../../../../util/aggregate/aggregateUtil/min/booleanMin";
import { getDateMin } from "../../../../util/aggregate/aggregateUtil/min/dateMin";
import { getStringMin } from "../../../../util/aggregate/aggregateUtil/min/stringMin";

const emoji1 = "\u{1F600}";
const emoji2 = "\u{1F601}";
const ffl = "\uFB04";
const composedE = "\u00E9";
const decomposedE = "e\u0301";
const hiraA = "あ";
const hiraI = "い";
const hiraU = "う";

describe("string max/min semantics", () => {
  test("empty string is smaller than any non-empty string", () => {
    expect(getStringMax(["", "a", ""])).toBe("a");
    expect(getStringMin(["a", "", "b"])).toBe("");
  });

  test("ascii strings follow code unit order", () => {
    expect(getStringMax(["Zebra", "apple", "Banana"])).toBe("apple");
    expect(getStringMin(["Zebra", "apple", "Banana"])).toBe("Banana");
  });

  test("japanese strings follow code unit order", () => {
    expect(getStringMax([hiraA + hiraI, hiraA + hiraU, hiraA])).toBe(
      hiraA + hiraU,
    );
    expect(getStringMin([hiraA + hiraI, hiraA + hiraU, hiraA])).toBe(hiraA);
  });

  test("surrogate pair strings follow code unit order", () => {
    expect(getStringMax([emoji1, "abc", ffl])).toBe(ffl);
    expect(getStringMin([emoji1, "abc", ffl])).toBe("abc");
    expect(getStringMax([emoji1, emoji2])).toBe(emoji2);
    expect(getStringMin([emoji1, emoji2])).toBe(emoji1);
  });

  test("combining character strings follow code unit order", () => {
    expect(getStringMax([decomposedE, composedE])).toBe(composedE);
    expect(getStringMin([decomposedE, composedE])).toBe(decomposedE);
  });

  test("common prefix: longer string wins for max, shorter for min", () => {
    expect(getStringMax(["abc", "abcd", "ab"])).toBe("abcd");
    expect(getStringMin(["abc", "abcd", "ab"])).toBe("ab");
  });

  test("duplicated equal values resolve to that value", () => {
    expect(getStringMax(["abc", "abc", "ab"])).toBe("abc");
    expect(getStringMin(["abc", "abc", "abcd"])).toBe("abc");
  });

  test("single element array returns the element", () => {
    expect(getStringMax(["only"])).toBe("only");
    expect(getStringMin(["only"])).toBe("only");
  });

  test("empty array returns undefined", () => {
    expect(getStringMax([])).toBeUndefined();
    expect(getStringMin([])).toBeUndefined();
  });

  test("matches code unit lexicographic order oracle on mixed pool", () => {
    const pool = [
      "",
      "a",
      "A",
      "abc",
      "abcd",
      "abce",
      "ab",
      hiraA + hiraI + hiraU,
      hiraA + hiraI,
      emoji1,
      emoji2,
      `${emoji1}a`,
      composedE,
      decomposedE,
      ffl,
      "zzz",
      "  space",
      "123",
      "abc",
    ];
    const sorted = pool.slice().sort();
    expect(getStringMax(pool)).toBe(sorted[sorted.length - 1]);
    expect(getStringMin(pool)).toBe(sorted[0]);
  });
});

describe("number max/min semantics", () => {
  test("NaN is ignored like null", () => {
    expect(getMax([{ v: 1 }, { v: NaN }, { v: 2 }], { v: true })).toEqual({
      v: 2,
    });
    expect(getMin([{ v: 1 }, { v: NaN }, { v: 2 }], { v: true })).toEqual({
      v: 1,
    });
  });

  test("all NaN yields null", () => {
    expect(getMax([{ v: NaN }, { v: NaN }], { v: true })).toEqual({ v: null });
    expect(getMin([{ v: NaN }, { v: NaN }], { v: true })).toEqual({ v: null });
  });

  test("Infinity and -Infinity are handled", () => {
    expect(
      getMax([{ v: Number.POSITIVE_INFINITY }, { v: 1 }], { v: true }),
    ).toEqual({ v: Number.POSITIVE_INFINITY });
    expect(
      getMin([{ v: Number.NEGATIVE_INFINITY }, { v: 1 }], { v: true }),
    ).toEqual({ v: Number.NEGATIVE_INFINITY });
  });

  test("max of -0 and 0 is 0, min is -0", () => {
    const maxResult: Record<string, number> = getMax([{ v: -0 }, { v: 0 }], {
      v: true,
    });
    expect(Object.is(maxResult.v, 0)).toBe(true);
    const minResult: Record<string, number> = getMin([{ v: -0 }, { v: 0 }], {
      v: true,
    });
    expect(Object.is(minResult.v, -0)).toBe(true);
  });

  test("negative numbers and decimals", () => {
    expect(getMax([{ v: -5 }, { v: -2.5 }, { v: -10 }], { v: true })).toEqual({
      v: -2.5,
    });
    expect(getMin([{ v: -5 }, { v: -2.5 }, { v: -10 }], { v: true })).toEqual({
      v: -10,
    });
  });
});

describe("date max/min semantics", () => {
  test("same instant different instances", () => {
    const a = new Date(1700000000000);
    const b = new Date(1700000000000);
    expect(getDateMax([a, b]).getTime()).toBe(1700000000000);
    expect(getDateMin([a, b]).getTime()).toBe(1700000000000);
  });

  test("getMax/getMin ignore Invalid Date like null", () => {
    const invalid = new Date("invalid");
    const early = new Date(1600000000000);
    const late = new Date(1700000000000);
    const rows = [{ v: early }, { v: invalid }, { v: late }];
    expect(getMax(rows, { v: true })).toEqual({ v: late });
    expect(getMin(rows, { v: true })).toEqual({ v: early });
  });

  test("getMax/getMin with only Invalid Date yield null", () => {
    const rows = [{ v: new Date("invalid") }, { v: new Date("invalid") }];
    expect(getMax(rows, { v: true })).toEqual({ v: null });
    expect(getMin(rows, { v: true })).toEqual({ v: null });
  });

  test("Invalid Date propagates as Invalid Date", () => {
    const invalid = new Date(Number.NaN);
    const valid = new Date(1700000000000);
    expect(Number.isNaN(getDateMax([valid, invalid]).getTime())).toBe(true);
    expect(Number.isNaN(getDateMin([valid, invalid]).getTime())).toBe(true);
  });

  test("empty array returns Invalid Date", () => {
    expect(Number.isNaN(getDateMax([]).getTime())).toBe(true);
    expect(Number.isNaN(getDateMin([]).getTime())).toBe(true);
  });
});

describe("boolean max/min semantics", () => {
  test("max is true iff any true, min is true iff all true", () => {
    expect(getBooleanMax([false, true, false])).toBe(true);
    expect(getBooleanMax([false, false])).toBe(false);
    expect(getBooleanMin([true, true])).toBe(true);
    expect(getBooleanMin([true, false, true])).toBe(false);
  });

  test("empty array returns false", () => {
    expect(getBooleanMax([])).toBe(false);
    expect(getBooleanMin([])).toBe(false);
  });
});
