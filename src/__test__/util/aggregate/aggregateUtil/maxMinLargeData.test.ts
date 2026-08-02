import { getMax } from "../../../../util/aggregate/aggregateUtil/max";
import { getBooleanMax } from "../../../../util/aggregate/aggregateUtil/max/booleanMax";
import { getDateMax } from "../../../../util/aggregate/aggregateUtil/max/dateMax";
import { getStringMax } from "../../../../util/aggregate/aggregateUtil/max/stringMax";
import { getMin } from "../../../../util/aggregate/aggregateUtil/min";
import { getBooleanMin } from "../../../../util/aggregate/aggregateUtil/min/booleanMin";
import { getDateMin } from "../../../../util/aggregate/aggregateUtil/min/dateMin";
import { getStringMin } from "../../../../util/aggregate/aggregateUtil/min/stringMin";

const LARGE = 150000;

describe("max/min aggregate with large datasets", () => {
  test("getMax handles 150000 number rows", () => {
    const rows = Array.from({ length: LARGE }, (_, i) => ({
      value: i % 100000,
    }));
    expect(getMax(rows, { value: true })).toEqual({ value: 99999 });
  });

  test("getMin handles 150000 number rows", () => {
    const rows = Array.from({ length: LARGE }, (_, i) => ({
      value: (i % 100000) - 50000,
    }));
    expect(getMin(rows, { value: true })).toEqual({ value: -50000 });
  });

  test("getDateMax handles 150000 dates", () => {
    const dates = Array.from(
      { length: LARGE },
      (_, i) => new Date(1700000000000 + (i % 100000) * 1000),
    );
    expect(getDateMax(dates)).toEqual(new Date(1700000000000 + 99999000));
  });

  test("getDateMin handles 150000 dates", () => {
    const dates = Array.from(
      { length: LARGE },
      (_, i) => new Date(1700000000000 + (i % 100000) * 1000),
    );
    expect(getDateMin(dates)).toEqual(new Date(1700000000000));
  });

  test("getBooleanMax handles 150000 booleans", () => {
    const booleans = Array.from({ length: LARGE }, (_, i) => i % 3 === 0);
    expect(getBooleanMax(booleans)).toBe(true);
  });

  test("getBooleanMin handles 150000 booleans", () => {
    const booleans = Array.from({ length: LARGE }, (_, i) => i % 3 === 0);
    expect(getBooleanMin(booleans)).toBe(false);
  });

  test("getStringMax handles 150000 strings", () => {
    const strings = Array.from(
      { length: LARGE },
      (_, i) => `item-${String(i % 100000).padStart(6, "0")}`,
    );
    expect(getStringMax(strings)).toBe("item-099999");
  });

  test("getStringMin handles 150000 strings", () => {
    const strings = Array.from(
      { length: LARGE },
      (_, i) => `item-${String(i % 100000).padStart(6, "0")}`,
    );
    expect(getStringMin(strings)).toBe("item-000000");
  });
});
