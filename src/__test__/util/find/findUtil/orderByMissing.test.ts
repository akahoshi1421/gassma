import { orderByFunc } from "../../../../util/find/findUtil/orderBy";
import type { OrderBy } from "../../../../types/coreTypes";
import { isDateValue } from "../../../../util/other/isDateValue";

const canonical = (value: unknown): unknown => {
  if (value === null || value === undefined) return "missing";
  if (typeof value === "number" && Number.isNaN(value)) return "missing";
  if (isDateValue(value)) {
    return Number.isNaN(value.getTime()) ? "missing" : value.getTime();
  }
  return value;
};

const toRows = (values: unknown[]): Record<string, unknown>[] =>
  values.map((v, i) => ({ id: i, v }));

const sortedCanonical = (values: unknown[], orderBy: OrderBy[]): unknown[] =>
  orderByFunc(toRows(values), orderBy).map((row) => canonical(row.v));

const permutations = (values: unknown[]): unknown[][] => {
  if (values.length <= 1) return [values];
  return values.flatMap((v, i) =>
    permutations([...values.slice(0, i), ...values.slice(i + 1)]).map(
      (rest) => [v, ...rest],
    ),
  );
};

describe("orderBy with missing values (null / NaN / Invalid Date)", () => {
  test("should sort numbers with NaN and null mixed (asc, defaults first)", () => {
    expect(
      sortedCanonical([3, Number.NaN, 1, null, 2], [{ v: "asc" }]),
    ).toEqual(["missing", "missing", 1, 2, 3]);
  });

  test("should move a leading NaN with the missing group (asc)", () => {
    expect(sortedCanonical([Number.NaN, 3, 1, 2], [{ v: "asc" }])).toEqual([
      "missing",
      1,
      2,
      3,
    ]);
  });

  test("should move a trailing NaN with the missing group (asc)", () => {
    expect(sortedCanonical([3, 1, 2, Number.NaN], [{ v: "asc" }])).toEqual([
      "missing",
      1,
      2,
      3,
    ]);
  });

  test("should keep plain null sorting unchanged (asc)", () => {
    expect(sortedCanonical([3, 1, null, 2], [{ v: "asc" }])).toEqual([
      "missing",
      1,
      2,
      3,
    ]);
  });

  test("should place missing values last by default with desc", () => {
    expect(sortedCanonical([3, Number.NaN, 1, null], [{ v: "desc" }])).toEqual([
      3,
      1,
      "missing",
      "missing",
    ]);
  });

  test("should apply nulls: last to NaN as well (asc)", () => {
    expect(
      sortedCanonical(
        [3, Number.NaN, null, 1],
        [{ v: { sort: "asc", nulls: "last" } }],
      ),
    ).toEqual([1, 3, "missing", "missing"]);
  });

  test("should apply nulls: first to NaN as well (desc)", () => {
    expect(
      sortedCanonical(
        [3, Number.NaN, 1, null],
        [{ v: { sort: "desc", nulls: "first" } }],
      ),
    ).toEqual(["missing", "missing", 3, 1]);
  });

  test("should treat Invalid Date as missing among valid dates", () => {
    expect(
      sortedCanonical(
        [new Date(5000), new Date("invalid"), new Date(1000)],
        [{ v: "asc" }],
      ),
    ).toEqual(["missing", 1000, 5000]);
  });

  test("should tie-break rows whose first key is missing by the next key", () => {
    const rows = [
      { a: Number.NaN, b: 2 },
      { a: Number.NaN, b: 1 },
      { a: null, b: 0 },
      { a: 1, b: 9 },
    ];
    const result = orderByFunc(rows, [{ a: "asc" }, { b: "asc" }]);
    expect(result.map((row) => row.b)).toEqual([0, 1, 2, 9]);
  });

  describe("permutation invariance", () => {
    const cases: [string, unknown[], OrderBy[]][] = [
      [
        "numbers with NaN and null (asc)",
        [3, Number.NaN, 1, null, 2],
        [{ v: "asc" }],
      ],
      [
        "numbers with NaN and null (desc)",
        [3, Number.NaN, 1, null, 2],
        [{ v: "desc" }],
      ],
      [
        "numbers with NaN and null (asc, nulls last)",
        [3, Number.NaN, 1, null, 2],
        [{ v: { sort: "asc", nulls: "last" } }],
      ],
      [
        "dates with Invalid Date and NaN (asc)",
        [null, Number.NaN, new Date("invalid"), new Date(0), 5],
        [{ v: "asc" }],
      ],
    ];

    test.each(cases)(
      "should return the same order for every input permutation: %s",
      (_label, values, orderBy) => {
        const expected = sortedCanonical(values, orderBy);
        permutations(values).forEach((permuted) => {
          expect(sortedCanonical(permuted, orderBy)).toEqual(expected);
        });
      },
    );
  });
});
