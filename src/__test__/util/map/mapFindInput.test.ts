import {
  mapOrderByToSheet,
  mapCursorToSheet,
  mapDistinctToSheet,
} from "../../../util/map/mapFindInput";
import type { FieldMapping } from "../../../util/map/mapFields";

describe("mapOrderByToSheet", () => {
  const mapping: FieldMapping = {
    totalAmount: "total_amount",
    firstName: "first_name",
  };

  it("should return undefined for undefined", () => {
    expect(mapOrderByToSheet(undefined, mapping)).toBeUndefined();
  });

  it("should map single orderBy object keys", () => {
    const result = mapOrderByToSheet({ totalAmount: "desc" }, mapping);
    expect(result).toEqual({ total_amount: "desc" });
  });

  it("should map array of orderBy objects", () => {
    const result = mapOrderByToSheet(
      [{ totalAmount: "desc" }, { firstName: "asc" }],
      mapping,
    );
    expect(result).toEqual([{ total_amount: "desc" }, { first_name: "asc" }]);
  });

  it("should not modify unmapped keys", () => {
    const result = mapOrderByToSheet({ status: "asc" }, mapping);
    expect(result).toEqual({ status: "asc" });
  });

  it("should handle SortOrderInput object values", () => {
    const result = mapOrderByToSheet(
      { totalAmount: { sort: "desc", nulls: "last" } },
      mapping,
    );
    expect(result).toEqual({ total_amount: { sort: "desc", nulls: "last" } });
  });
});

describe("mapCursorToSheet", () => {
  const mapping: FieldMapping = {
    totalAmount: "total_amount",
  };

  it("should return undefined for undefined", () => {
    expect(mapCursorToSheet(undefined, mapping)).toBeUndefined();
  });

  it("should map cursor keys", () => {
    const result = mapCursorToSheet({ id: 1, totalAmount: 5000 }, mapping);
    expect(result).toEqual({ id: 1, total_amount: 5000 });
  });
});

describe("mapDistinctToSheet", () => {
  const mapping: FieldMapping = {
    totalAmount: "total_amount",
    firstName: "first_name",
  };

  it("should return undefined for undefined", () => {
    expect(mapDistinctToSheet(undefined, mapping)).toBeUndefined();
  });

  it("should map single string", () => {
    expect(mapDistinctToSheet("totalAmount", mapping)).toBe("total_amount");
  });

  it("should map array of strings", () => {
    const result = mapDistinctToSheet(
      ["totalAmount", "status", "firstName"],
      mapping,
    );
    expect(result).toEqual(["total_amount", "status", "first_name"]);
  });
});
