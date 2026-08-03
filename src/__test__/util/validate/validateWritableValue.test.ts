import { GassmaInvalidValueError } from "../../../errors/argument/argumentError";
import { FieldRef } from "../../../util/filterConditions/fieldRef";
import { raw } from "../../../util/raw/raw";
import { validateWritableValue } from "../../../util/validate/validateWritableValue";
import {
  createCrossRealmDate,
  createCrossRealmValue,
} from "../../consts/crossRealm";

describe("validateWritableValue", () => {
  test("should accept scalar values and a valid Date", () => {
    const values: unknown[] = [
      "text",
      42,
      0,
      true,
      false,
      null,
      undefined,
      new Date("2026-07-18T09:30:00.000Z"),
    ];
    values.forEach((value) => {
      expect(() => validateWritableValue("col", value)).not.toThrow();
    });
  });

  test("should throw for NaN and Infinity", () => {
    expect(() => validateWritableValue("col", Number.NaN)).toThrow(
      GassmaInvalidValueError,
    );
    expect(() => validateWritableValue("col", Infinity)).toThrow(
      "Invalid value for argument `col`. Expected a finite number, but received Infinity.",
    );
  });

  test("should throw for an Invalid Date", () => {
    expect(() => validateWritableValue("col", new Date("nope"))).toThrow(
      "Invalid value for argument `col`. Expected a valid Date, but the provided Date object is invalid.",
    );
  });

  test("should throw for an array", () => {
    expect(() => validateWritableValue("col", [1, 2])).toThrow(
      "Invalid value for argument `col`. Expected a scalar value, but received an array.",
    );
  });

  test("should throw for a function, a symbol and a bigint", () => {
    expect(() => validateWritableValue("col", () => 1)).toThrow(
      GassmaInvalidValueError,
    );
    expect(() => validateWritableValue("col", Symbol("x"))).toThrow(
      GassmaInvalidValueError,
    );
    expect(() => validateWritableValue("col", BigInt(1))).toThrow(
      GassmaInvalidValueError,
    );
  });
});

describe("validateWritableValue with object values", () => {
  test("should accept a FieldRef and a Gassma.raw value", () => {
    expect(() =>
      validateWritableValue("col", new FieldRef("Posts", "rating")),
    ).not.toThrow();
    expect(() => validateWritableValue("col", raw("=A1"))).not.toThrow();
  });

  test("should throw for a Map, a Set and a RegExp", () => {
    expect(() => validateWritableValue("col", new Map())).toThrow(
      "Invalid value for argument `col`. Expected a scalar value, but received a Map.",
    );
    expect(() => validateWritableValue("col", new Set())).toThrow(
      "Invalid value for argument `col`. Expected a scalar value, but received a Set.",
    );
    expect(() => validateWritableValue("col", /re/)).toThrow(
      "Invalid value for argument `col`. Expected a scalar value, but received a RegExp.",
    );
  });

  test("should throw for a class instance and a plain object", () => {
    class Point {
      x = 1;
    }
    expect(() => validateWritableValue("col", new Point())).toThrow(
      "Invalid value for argument `col`. Expected a scalar value, but received an object.",
    );
    expect(() => validateWritableValue("col", Object.create({ a: 1 }))).toThrow(
      "Invalid value for argument `col`. Expected a scalar value, but received an object.",
    );
    expect(() => validateWritableValue("col", {})).toThrow(
      GassmaInvalidValueError,
    );
  });

  test("should throw for an Error and a Promise", () => {
    expect(() => validateWritableValue("col", new Error("x"))).toThrow(
      "Invalid value for argument `col`. Expected a scalar value, but received an Error.",
    );
    expect(() => validateWritableValue("col", Promise.resolve())).toThrow(
      "Invalid value for argument `col`. Expected a scalar value, but received a Promise.",
    );
  });
});

describe("validateWritableValue with cross-realm values", () => {
  test("should throw for a cross-realm Map and plain object", () => {
    const crossMap = createCrossRealmValue<unknown>("new Map()");
    expect(() => validateWritableValue("col", crossMap)).toThrow(
      "Invalid value for argument `col`. Expected a scalar value, but received a Map.",
    );
    const crossObject = createCrossRealmValue<unknown>("({ a: 1 })");
    expect(() => validateWritableValue("col", crossObject)).toThrow(
      "Invalid value for argument `col`. Expected a scalar value, but received an object.",
    );
  });

  test("should accept a cross-realm valid Date", () => {
    const crossDate = createCrossRealmDate("2026-07-18T09:30:00.000Z");
    expect(crossDate instanceof Date).toBe(false);
    expect(() => validateWritableValue("col", crossDate)).not.toThrow();
  });

  test("should throw for a cross-realm Invalid Date", () => {
    const crossInvalid = createCrossRealmValue<Date>('new Date("nope")');
    expect(() => validateWritableValue("col", crossInvalid)).toThrow(
      "Invalid value for argument `col`. Expected a valid Date, but the provided Date object is invalid.",
    );
  });

  test("should throw for a cross-realm array", () => {
    const crossArray = createCrossRealmValue<unknown[]>("[1, 2]");
    expect(() => validateWritableValue("col", crossArray)).toThrow(
      "Invalid value for argument `col`. Expected a scalar value, but received an array.",
    );
  });

  test("should throw for a cross-realm function", () => {
    const crossFn = createCrossRealmValue<() => number>("function f() {}");
    expect(() => validateWritableValue("col", crossFn)).toThrow(
      "Invalid value for argument `col`. Expected a scalar value, but received a function.",
    );
  });

  test("should throw for a cross-realm symbol", () => {
    const crossSymbol = createCrossRealmValue<symbol>('Symbol("x")');
    expect(() => validateWritableValue("col", crossSymbol)).toThrow(
      "Invalid value for argument `col`. Expected a scalar value, but received a symbol.",
    );
  });

  test("should throw for a cross-realm bigint", () => {
    const crossBigInt = createCrossRealmValue<bigint>("10n");
    expect(() => validateWritableValue("col", crossBigInt)).toThrow(
      "Invalid value for argument `col`. Expected a scalar value, but received a bigint.",
    );
  });
});
