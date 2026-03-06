import { applySkipTake } from "../../../../util/find/findUtil/applySkipTake";

const data = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
  { id: 3, name: "Charlie" },
  { id: 4, name: "David" },
  { id: 5, name: "Eve" },
];

describe("applySkipTake", () => {
  test("should return all data when no skip/take", () => {
    const result = applySkipTake(data, null, null);
    expect(result).toEqual(data);
  });

  test("should skip records", () => {
    const result = applySkipTake(data, 2, null);
    expect(result).toEqual([
      { id: 3, name: "Charlie" },
      { id: 4, name: "David" },
      { id: 5, name: "Eve" },
    ]);
  });

  test("should take positive records", () => {
    const result = applySkipTake(data, null, 3);
    expect(result).toEqual([
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
      { id: 3, name: "Charlie" },
    ]);
  });

  test("should apply skip then take", () => {
    const result = applySkipTake(data, 1, 2);
    expect(result).toEqual([
      { id: 2, name: "Bob" },
      { id: 3, name: "Charlie" },
    ]);
  });

  test("should handle take 0", () => {
    const result = applySkipTake(data, null, 0);
    expect(result).toEqual([]);
  });

  test("should handle negative take", () => {
    const result = applySkipTake(data, null, -2);
    expect(result).toEqual([
      { id: 4, name: "David" },
      { id: 5, name: "Eve" },
    ]);
  });

  test("should handle skip with negative take", () => {
    const result = applySkipTake(data, 1, -2);
    expect(result).toEqual([
      { id: 3, name: "Charlie" },
      { id: 4, name: "David" },
    ]);
  });

  test("should throw GassmaSkipNegativeError for negative skip", () => {
    expect(() => applySkipTake(data, -1, null)).toThrow(
      "Value can only be positive",
    );
  });
});
