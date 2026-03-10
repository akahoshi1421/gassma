import { stripIgnoreFromSelect } from "../../../util/ignore/stripIgnoreFromSelect";

describe("stripIgnoreFromSelect", () => {
  it("should remove ignored fields from select", () => {
    const select = { id: true, name: true, internalNote: true } as const;
    const result = stripIgnoreFromSelect(select, ["internalNote"]);
    expect(result).toEqual({ id: true, name: true });
  });

  it("should return select unchanged when no ignored fields match", () => {
    const select = { id: true, name: true } as const;
    const result = stripIgnoreFromSelect(select, ["internalNote"]);
    expect(result).toEqual({ id: true, name: true });
  });

  it("should handle multiple ignored fields", () => {
    const select = { id: true, name: true, a: true, b: true } as const;
    const result = stripIgnoreFromSelect(select, ["a", "b"]);
    expect(result).toEqual({ id: true, name: true });
  });

  it("should return select unchanged when ignoredFields is empty", () => {
    const select = { id: true, name: true } as const;
    const result = stripIgnoreFromSelect(select, []);
    expect(result).toEqual({ id: true, name: true });
  });
});
