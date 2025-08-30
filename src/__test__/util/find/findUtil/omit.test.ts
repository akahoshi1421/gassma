import { omitFunc } from "../../../../util/find/findUtil/omit";
import { Omit } from "../../../../types/coreTypes";

describe("omitFunc", () => {
  const testData = {
    name: "John",
    age: 30,
    email: "john@example.com",
    address: "123 Main St",
    phone: "555-1234"
  };

  test("should omit single field", () => {
    const omit: Omit = { email: true };
    const result = omitFunc(omit, testData);
    
    expect(result).toEqual({
      name: "John",
      age: 30,
      address: "123 Main St",
      phone: "555-1234"
    });
    expect(result).not.toHaveProperty("email");
  });

  test("should omit multiple fields", () => {
    const omit: Omit = { email: true, phone: true };
    const result = omitFunc(omit, testData);
    
    expect(result).toEqual({
      name: "John",
      age: 30,
      address: "123 Main St"
    });
    expect(result).not.toHaveProperty("email");
    expect(result).not.toHaveProperty("phone");
  });

  test("should return original object when no fields to omit", () => {
    const omit: Omit = {};
    const result = omitFunc(omit, testData);
    
    expect(result).toEqual(testData);
  });

  test("should not mutate original object", () => {
    const omit: Omit = { email: true };
    const original = { ...testData };
    const result = omitFunc(omit, testData);
    
    expect(testData).toEqual(original);
    expect(result).not.toBe(testData);
  });

  test("should handle non-existent fields gracefully", () => {
    const omit: Omit = { nonExistentField: true, email: true };
    const result = omitFunc(omit, testData);
    
    expect(result).toEqual({
      name: "John",
      age: 30,
      address: "123 Main St",
      phone: "555-1234"
    });
    expect(result).not.toHaveProperty("email");
  });

  test("should handle empty object", () => {
    const omit: Omit = { field: true };
    const result = omitFunc(omit, {});
    
    expect(result).toEqual({});
  });
});