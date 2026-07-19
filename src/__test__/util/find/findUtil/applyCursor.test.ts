import { applyCursor } from "../../../../util/find/findUtil/applyCursor";

const data = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
  { id: 3, name: "Charlie" },
  { id: 4, name: "David" },
  { id: 5, name: "Eve" },
];

describe("applyCursor", () => {
  test("should return empty array when cursor not found", () => {
    const result = applyCursor(data, { id: 99 });
    expect(result).toEqual([]);
  });

  test("should return records from cursor to end when take is null", () => {
    const result = applyCursor(data, { id: 3 });
    expect(result).toEqual([
      { id: 3, name: "Charlie" },
      { id: 4, name: "David" },
      { id: 5, name: "Eve" },
    ]);
  });

  test("should match cursor with multiple keys", () => {
    const result = applyCursor(data, { id: 3, name: "Charlie" });
    expect(result).toEqual([
      { id: 3, name: "Charlie" },
      { id: 4, name: "David" },
      { id: 5, name: "Eve" },
    ]);
  });

  test("should return empty array when cursor keys partially match", () => {
    const result = applyCursor(data, { id: 3, name: "Alice" });
    expect(result).toEqual([]);
  });

  test("should match a Date cursor with the same time but different instance", () => {
    const dateData = [
      { id: 1, createdAt: new Date("2026-07-18T09:30:00.000Z") },
      { id: 2, createdAt: new Date("2026-07-19T12:00:00.000Z") },
      { id: 3, createdAt: new Date("2026-07-20T15:45:00.000Z") },
    ];
    const result = applyCursor(dateData, {
      createdAt: new Date("2026-07-19T12:00:00.000Z"),
    });
    expect(result).toEqual([dateData[1], dateData[2]]);
  });

  test("should return empty array when no Date time matches", () => {
    const dateData = [
      { id: 1, createdAt: new Date("2026-07-18T09:30:00.000Z") },
    ];
    const result = applyCursor(dateData, {
      createdAt: new Date("2026-07-18T09:30:00.001Z"),
    });
    expect(result).toEqual([]);
  });
});
