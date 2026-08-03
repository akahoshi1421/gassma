import { GassmaInvalidValueError } from "../../../errors/argument/argumentError";
import { raw } from "../../../util/raw/raw";
import { validateQueryValues } from "../../../util/validate/validateQueryValues";
import {
  createCrossRealmDate,
  createCrossRealmValue,
} from "../../consts/crossRealm";

describe("validateQueryValues", () => {
  test("should accept scalars, a valid Date and operator dicts", () => {
    expect(() =>
      validateQueryValues({
        name: "Tanaka",
        age: { gt: 20 },
        createdAt: new Date("2026-07-18T09:30:00.000Z"),
        id: { in: [1, 2, 3] },
      }),
    ).not.toThrow();
  });

  test("should throw for NaN as a direct value", () => {
    expect(() => validateQueryValues({ age: Number.NaN })).toThrow(
      GassmaInvalidValueError,
    );
  });

  test("should throw for an Invalid Date inside an operator dict", () => {
    expect(() =>
      validateQueryValues({ createdAt: { gt: new Date("nope") } }),
    ).toThrow(
      "Invalid value for argument `gt`. Expected a valid Date, but the provided Date object is invalid.",
    );
  });

  test("should throw for an invalid item inside an in list", () => {
    expect(() => validateQueryValues({ age: { in: [1, Number.NaN] } })).toThrow(
      GassmaInvalidValueError,
    );
  });

  test("should throw for an invalid value nested under AND / OR / NOT", () => {
    expect(() =>
      validateQueryValues({
        AND: [{ OR: [{ NOT: { age: Infinity } }] }],
      }),
    ).toThrow(GassmaInvalidValueError);
  });

  test("should throw for a Gassma.raw value inside where", () => {
    expect(() => validateQueryValues({ name: raw("=A1") })).toThrow(
      "Invalid value for argument `name`. Expected a scalar value, but received a Gassma.raw value.",
    );
  });
});

describe("validateQueryValues with cross-realm values", () => {
  test("should accept a cross-realm valid Date as a direct value", () => {
    const crossDate = createCrossRealmDate("2026-07-18T09:30:00.000Z");
    expect(() => validateQueryValues({ createdAt: crossDate })).not.toThrow();
  });

  test("should accept a cross-realm valid Date inside an operator dict", () => {
    const crossDate = createCrossRealmDate("2026-07-18T09:30:00.000Z");
    expect(() =>
      validateQueryValues({ createdAt: { gte: crossDate } }),
    ).not.toThrow();
  });

  test("should throw for a cross-realm Invalid Date as a direct value", () => {
    const crossInvalid = createCrossRealmValue<Date>('new Date("nope")');
    expect(() => validateQueryValues({ createdAt: crossInvalid })).toThrow(
      "Invalid value for argument `createdAt`. Expected a valid Date, but the provided Date object is invalid.",
    );
  });

  test("should recognize a cross-realm plain object as an operator dict", () => {
    const invalidOperators = createCrossRealmValue<Record<string, unknown>>(
      '{ gt: new Date("nope") }',
    );
    expect(() => validateQueryValues({ createdAt: invalidOperators })).toThrow(
      "Invalid value for argument `gt`. Expected a valid Date, but the provided Date object is invalid.",
    );

    const validOperators = createCrossRealmValue<Record<string, unknown>>(
      '{ gt: new Date("2026-07-18T09:30:00.000Z") }',
    );
    expect(() =>
      validateQueryValues({ createdAt: validOperators }),
    ).not.toThrow();
  });

  test("should throw for a cross-realm Invalid Date deep under AND / OR / NOT", () => {
    const crossInvalid = createCrossRealmValue<Date>('new Date("nope")');
    expect(() =>
      validateQueryValues({
        AND: [{ OR: [{ NOT: { createdAt: { lt: crossInvalid } } }] }],
      }),
    ).toThrow(GassmaInvalidValueError);
  });

  test("should walk a cross-realm object used as a logical branch", () => {
    const crossBranch = createCrossRealmValue<Record<string, unknown>>(
      "{ age: Number.NaN }",
    );
    expect(() => validateQueryValues({ NOT: crossBranch })).toThrow(
      GassmaInvalidValueError,
    );
  });

  test("should throw for a cross-realm Invalid Date inside an in list", () => {
    const crossInvalid = createCrossRealmValue<Date>('new Date("nope")');
    expect(() =>
      validateQueryValues({ createdAt: { in: [crossInvalid] } }),
    ).toThrow(GassmaInvalidValueError);
  });

  test("should validate items of a cross-realm array used as an in list", () => {
    const crossInvalidList =
      createCrossRealmValue<unknown[]>('[new Date("nope")]');
    expect(() =>
      validateQueryValues({ createdAt: { in: crossInvalidList } }),
    ).toThrow(GassmaInvalidValueError);

    const crossValidList = createCrossRealmValue<unknown[]>(
      '[new Date("2026-07-18T09:30:00.000Z"), 1, "a"]',
    );
    expect(() =>
      validateQueryValues({ createdAt: { in: crossValidList } }),
    ).not.toThrow();
  });

  test("should throw for a cross-realm array as a direct value", () => {
    const crossArray = createCrossRealmValue<unknown[]>("[1, 2]");
    expect(() => validateQueryValues({ age: crossArray })).toThrow(
      "Invalid value for argument `age`. Expected a scalar value, but received an array.",
    );
  });

  test("should throw for a cross-realm function, symbol and bigint", () => {
    expect(() =>
      validateQueryValues({
        age: createCrossRealmValue<() => void>("function f() {}"),
      }),
    ).toThrow(GassmaInvalidValueError);
    expect(() =>
      validateQueryValues({
        age: createCrossRealmValue<symbol>('Symbol("x")'),
      }),
    ).toThrow(GassmaInvalidValueError);
    expect(() =>
      validateQueryValues({ age: createCrossRealmValue<bigint>("10n") }),
    ).toThrow(GassmaInvalidValueError);
  });
});
