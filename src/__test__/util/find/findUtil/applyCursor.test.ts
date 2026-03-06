import { applyCursor } from "../../../../util/find/findUtil/applyCursor";

const data = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
  { id: 3, name: "Charlie" },
  { id: 4, name: "David" },
  { id: 5, name: "Eve" },
];

describe("applyCursor", () => {
  test("should return records from cursor to end with positive take", () => {
    const result = applyCursor(data, { id: 2 }, 3);
    expect(result).toEqual([
      { id: 2, name: "Bob" },
      { id: 3, name: "Charlie" },
      { id: 4, name: "David" },
      { id: 5, name: "Eve" },
    ]);
  });

  test("should return records from start to cursor with negative take", () => {
    const result = applyCursor(data, { id: 4 }, -3);
    expect(result).toEqual([
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
      { id: 3, name: "Charlie" },
      { id: 4, name: "David" },
    ]);
  });

  test("should return empty array when cursor not found", () => {
    const result = applyCursor(data, { id: 99 }, 3);
    expect(result).toEqual([]);
  });

  test("should return records from cursor to end when take is null", () => {
    const result = applyCursor(data, { id: 3 }, null);
    expect(result).toEqual([
      { id: 3, name: "Charlie" },
      { id: 4, name: "David" },
      { id: 5, name: "Eve" },
    ]);
  });

  test("should return records from cursor to end when take is undefined", () => {
    const result = applyCursor(data, { id: 3 }, undefined);
    expect(result).toEqual([
      { id: 3, name: "Charlie" },
      { id: 4, name: "David" },
      { id: 5, name: "Eve" },
    ]);
  });

  test("should match cursor with multiple keys", () => {
    const result = applyCursor(data, { id: 3, name: "Charlie" }, 2);
    expect(result).toEqual([
      { id: 3, name: "Charlie" },
      { id: 4, name: "David" },
      { id: 5, name: "Eve" },
    ]);
  });

  test("should return empty array when cursor keys partially match", () => {
    const result = applyCursor(data, { id: 3, name: "Alice" }, 2);
    expect(result).toEqual([]);
  });
});
