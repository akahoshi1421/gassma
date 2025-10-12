import { isDict } from "../../../util/other/isDict";

describe("isDict", () => {
  test("should return true for an object", () => {
    const obj = { key: "value" };
    expect(isDict(obj)).toBe(true);
  });

  test("should return true for an empty object", () => {
    const obj = {};
    expect(isDict(obj)).toBe(true);
  });

  test("should return true for nested objects", () => {
    const obj = { key: { nested: "value" } };
    expect(isDict(obj)).toBe(true);
  });

  test("should return false for an array", () => {
    const arr = [1, 2, 3];
    expect(isDict(arr)).toBe(false);
  });

  test("should return false for an empty array", () => {
    const arr: any[] = [];
    expect(isDict(arr)).toBe(false);
  });

  test("should return false for a string", () => {
    const str = "string";
    expect(isDict(str)).toBe(false);
  });

  test("should return false for an empty string", () => {
    const str = "";
    expect(isDict(str)).toBe(false);
  });

  test("should return false for a number", () => {
    const num = 123;
    expect(isDict(num)).toBe(false);
  });

  test("should return false for zero", () => {
    const num = 0;
    expect(isDict(num)).toBe(false);
  });

  test("should return false for negative numbers", () => {
    const num = -123;
    expect(isDict(num)).toBe(false);
  });

  test("should return false for floating point numbers", () => {
    const num = 123.45;
    expect(isDict(num)).toBe(false);
  });

  test("should return false for a boolean", () => {
    const bool = true;
    expect(isDict(bool)).toBe(false);
  });

  test("should return false for false boolean", () => {
    const bool = false;
    expect(isDict(bool)).toBe(false);
  });

  test("should return false for Date", () => {
    const date = new Date();
    expect(isDict(date)).toBe(false);
  });

  test("should return false for null", () => {
    expect(isDict(null)).toBe(false);
  });

  test("should return false for undefined", () => {
    expect(isDict(undefined)).toBe(false);
  });

  test("should return false for functions", () => {
    const func = () => {};
    expect(isDict(func)).toBe(false);
  });

  test("should return true for RegExp", () => {
    const regex = /test/;
    expect(isDict(regex)).toBe(true);
  });

  test("should return true for Error objects", () => {
    const error = new Error("test");
    expect(isDict(error)).toBe(true);
  });

  test("should return true for Map", () => {
    const map = new Map();
    expect(isDict(map)).toBe(true);
  });

  test("should return true for Set", () => {
    const set = new Set();
    expect(isDict(set)).toBe(true);
  });

  test("should return true for class instances", () => {
    class TestClass {}
    const instance = new TestClass();
    expect(isDict(instance)).toBe(true);
  });

  test("should handle objects with circular references", () => {
    const obj: any = { key: "value" };
    obj.circular = obj;
    expect(isDict(obj)).toBe(false);
  });

  test("should handle objects with non-serializable properties", () => {
    const obj = {
      key: "value",
      func: () => {},
    };
    expect(isDict(obj)).toBe(true);
  });

  test("should handle Symbol properties", () => {
    const sym = Symbol("test");
    const obj = {
      [sym]: "value",
      key: "value",
    };
    expect(isDict(obj)).toBe(true);
  });

  test("should handle objects created with Object.create(null)", () => {
    const obj = Object.create(null);
    obj.key = "value";
    expect(isDict(obj)).toBe(true);
  });

  test("should handle objects with prototype chain", () => {
    const parent = { parentKey: "parentValue" };
    const child = Object.create(parent);
    child.childKey = "childValue";
    expect(isDict(child)).toBe(true);
  });

  test("should handle BigInt values", () => {
    const bigint = BigInt(123);
    expect(isDict(bigint)).toBe(false);
  });

  test("should handle NaN", () => {
    expect(isDict(NaN)).toBe(false);
  });

  test("should handle Infinity", () => {
    expect(isDict(Infinity)).toBe(false);
  });

  test("should handle -Infinity", () => {
    expect(isDict(-Infinity)).toBe(false);
  });
});
