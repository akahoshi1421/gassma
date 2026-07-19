import { convertToNumber } from "../../../util/changeSettings/changeSettingsUtil/convertToNumber";

const invalidColumnValueMessage =
  "startColumnValue and endColumnValue can only use number, [a-z] and [A-Z].";

describe("convertToNumber", () => {
  test("should return the number as-is", () => {
    expect(convertToNumber(1)).toBe(1);
    expect(convertToNumber(100)).toBe(100);
  });

  test("should convert single letters", () => {
    expect(convertToNumber("A")).toBe(1);
    expect(convertToNumber("B")).toBe(2);
    expect(convertToNumber("Z")).toBe(26);
  });

  test("should convert two letters starting with A", () => {
    expect(convertToNumber("AA")).toBe(27);
    expect(convertToNumber("AB")).toBe(28);
    expect(convertToNumber("AZ")).toBe(52);
  });

  test("should convert two letters beyond AZ", () => {
    expect(convertToNumber("BA")).toBe(53);
    expect(convertToNumber("BZ")).toBe(78);
    expect(convertToNumber("ZA")).toBe(677);
    expect(convertToNumber("ZZ")).toBe(702);
  });

  test("should convert three letters", () => {
    expect(convertToNumber("AAA")).toBe(703);
    expect(convertToNumber("AAB")).toBe(704);
    expect(convertToNumber("ABA")).toBe(729);
  });

  test("should normalize lowercase letters", () => {
    expect(convertToNumber("a")).toBe(1);
    expect(convertToNumber("ba")).toBe(53);
    expect(convertToNumber("Ba")).toBe(53);
  });

  test("should throw for invalid strings", () => {
    expect(() => convertToNumber("")).toThrow(invalidColumnValueMessage);
    expect(() => convertToNumber("A1")).toThrow(invalidColumnValueMessage);
    expect(() => convertToNumber("1A")).toThrow(invalidColumnValueMessage);
    expect(() => convertToNumber("A B")).toThrow(invalidColumnValueMessage);
  });
});
