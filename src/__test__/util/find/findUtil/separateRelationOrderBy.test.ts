import { separateRelationOrderBy } from "../../../../util/find/findUtil/separateRelationOrderBy";

describe("separateRelationOrderBy", () => {
  test("should return empty arrays for empty input", () => {
    const result = separateRelationOrderBy([]);
    expect(result).toEqual({
      scalarOrderBy: [],
      relationOrderBy: [],
      hasRelationOrderBy: false,
    });
  });

  test("should classify scalar asc/desc as scalar", () => {
    const result = separateRelationOrderBy([{ name: "asc" }, { age: "desc" }]);
    expect(result.scalarOrderBy).toEqual([{ name: "asc" }, { age: "desc" }]);
    expect(result.relationOrderBy).toEqual([]);
    expect(result.hasRelationOrderBy).toBe(false);
  });

  test("should classify SortOrderInput as scalar", () => {
    const result = separateRelationOrderBy([
      { name: { sort: "asc", nulls: "last" } },
    ]);
    expect(result.scalarOrderBy).toEqual([
      { name: { sort: "asc", nulls: "last" } },
    ]);
    expect(result.hasRelationOrderBy).toBe(false);
  });

  test("should classify relation orderBy (object without sort key) as relation", () => {
    const result = separateRelationOrderBy([{ author: { name: "asc" } }]);
    expect(result.scalarOrderBy).toEqual([]);
    expect(result.relationOrderBy).toEqual([{ author: { name: "asc" } }]);
    expect(result.hasRelationOrderBy).toBe(true);
  });

  test("should handle mixed scalar and relation orderBy", () => {
    const result = separateRelationOrderBy([
      { title: "desc" },
      { author: { name: "asc" } },
      { createdAt: { sort: "desc", nulls: "first" } },
    ]);
    expect(result.scalarOrderBy).toEqual([
      { title: "desc" },
      { createdAt: { sort: "desc", nulls: "first" } },
    ]);
    expect(result.relationOrderBy).toEqual([{ author: { name: "asc" } }]);
    expect(result.hasRelationOrderBy).toBe(true);
  });

  test("should handle multiple relation orderBy entries", () => {
    const result = separateRelationOrderBy([
      { author: { name: "asc" } },
      { category: { title: "desc" } },
    ]);
    expect(result.scalarOrderBy).toEqual([]);
    expect(result.relationOrderBy).toEqual([
      { author: { name: "asc" } },
      { category: { title: "desc" } },
    ]);
    expect(result.hasRelationOrderBy).toBe(true);
  });
});
