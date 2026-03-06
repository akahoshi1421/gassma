import { applySelectOmit } from "../../../../util/find/findUtil/applySelectOmit";

const data = [
  { id: 1, name: "Alice", age: 28, city: "Tokyo" },
  { id: 2, name: "Bob", age: 35, city: "Osaka" },
];

describe("applySelectOmit", () => {
  test("should return data as-is when neither select nor omit specified", () => {
    const result = applySelectOmit(data, null, null);
    expect(result).toEqual(data);
  });

  test("should apply select", () => {
    const result = applySelectOmit(data, { name: true, age: true }, null);
    expect(result).toEqual([
      { name: "Alice", age: 28 },
      { name: "Bob", age: 35 },
    ]);
  });

  test("should apply omit", () => {
    const result = applySelectOmit(data, null, { city: true });
    expect(result).toEqual([
      { id: 1, name: "Alice", age: 28 },
      { id: 2, name: "Bob", age: 35 },
    ]);
  });

  test("should throw when both select and omit specified", () => {
    expect(() => applySelectOmit(data, { name: true }, { city: true })).toThrow(
      "Cannot use both select and omit",
    );
  });
});
