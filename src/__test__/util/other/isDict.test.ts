import { isDict } from "../../../app/util/other/isDict";

describe("isDict", () => {
  test("should return true for an object", () => {
    const obj = { key: "value" };
    expect(isDict(obj)).toBe(true);
  });

  test("should return false for an array", () => {
    const arr = [1, 2, 3];
    expect(isDict(arr)).toBe(false);
  });

  test("should return false for a string", () => {
    const str = "string";
    expect(isDict(str)).toBe(false);
  });

  test("should return false for a number", () => {
    const num = 123;
    expect(isDict(num)).toBe(false);
  });

  test("should return false for a boolean", () => {
    const bool = true;
    expect(isDict(bool)).toBe(false);
  });

  test("should return false for Date", () => {
    const date = new Date();
    expect(isDict(date)).toBe(false);
  });
});
