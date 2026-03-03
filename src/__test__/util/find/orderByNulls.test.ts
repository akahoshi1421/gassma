import { orderByFunc } from "../../../util/find/findUtil/orderBy";
import { findManyFunc } from "../../../util/find/findMany";
import { getExtendedMockControllerUtil } from "../../consts/mockControllerUtil";

describe("orderBy nulls option", () => {
  const dataWithNulls = [
    { name: "Alice", age: 28 },
    { name: null, age: 35 },
    { name: "Charlie", age: null },
    { name: "David", age: 45 },
    { name: null, age: null },
  ];

  describe("nulls: first", () => {
    test("should place null values first with asc sort", () => {
      const data = [...dataWithNulls];
      const result = orderByFunc(data, [
        { name: { sort: "asc", nulls: "first" } },
      ]);

      expect(result[0].name).toBeNull();
      expect(result[1].name).toBeNull();
      expect(result[2].name).toBe("Alice");
      expect(result[3].name).toBe("Charlie");
      expect(result[4].name).toBe("David");
    });

    test("should place null values first with desc sort", () => {
      const data = [...dataWithNulls];
      const result = orderByFunc(data, [
        { age: { sort: "desc", nulls: "first" } },
      ]);

      expect(result[0].age).toBeNull();
      expect(result[1].age).toBeNull();
      expect(result[2].age).toBe(45);
      expect(result[3].age).toBe(35);
      expect(result[4].age).toBe(28);
    });
  });

  describe("nulls: last", () => {
    test("should place null values last with asc sort", () => {
      const data = [...dataWithNulls];
      const result = orderByFunc(data, [
        { name: { sort: "asc", nulls: "last" } },
      ]);

      expect(result[0].name).toBe("Alice");
      expect(result[1].name).toBe("Charlie");
      expect(result[2].name).toBe("David");
      expect(result[3].name).toBeNull();
      expect(result[4].name).toBeNull();
    });

    test("should place null values last with desc sort", () => {
      const data = [...dataWithNulls];
      const result = orderByFunc(data, [
        { age: { sort: "desc", nulls: "last" } },
      ]);

      expect(result[0].age).toBe(45);
      expect(result[1].age).toBe(35);
      expect(result[2].age).toBe(28);
      expect(result[3].age).toBeNull();
      expect(result[4].age).toBeNull();
    });
  });

  describe("mixed with simple sort", () => {
    test("should work with SortOrderInput and simple string sort together", () => {
      const data = [
        { name: "Bob", age: null },
        { name: "Alice", age: null },
        { name: "Charlie", age: 30 },
      ];
      const result = orderByFunc(data, [
        { age: { sort: "asc", nulls: "last" } },
        { name: "asc" },
      ]);

      expect(result[0]).toEqual({ name: "Charlie", age: 30 });
      expect(result[1]).toEqual({ name: "Alice", age: null });
      expect(result[2]).toEqual({ name: "Bob", age: null });
    });
  });

  describe("without nulls option (SortOrderInput without nulls)", () => {
    test("should sort normally when nulls option is not specified", () => {
      const data = [
        { name: "Charlie", age: 30 },
        { name: "Alice", age: 20 },
        { name: "Bob", age: 25 },
      ];
      const result = orderByFunc(data, [{ age: { sort: "asc" } }]);

      expect(result[0]).toEqual({ name: "Alice", age: 20 });
      expect(result[1]).toEqual({ name: "Bob", age: 25 });
      expect(result[2]).toEqual({ name: "Charlie", age: 30 });
    });
  });

  describe("findManyFunc with orderBy only (no where)", () => {
    test("should not throw when where is not provided", () => {
      const result = findManyFunc(getExtendedMockControllerUtil(), {
        orderBy: { 年齢: { sort: "asc" } },
      });

      expect(result[0]["年齢"]).toBe(22);
      expect(result[result.length - 1]["年齢"]).toBe(52);
    });
  });
});
