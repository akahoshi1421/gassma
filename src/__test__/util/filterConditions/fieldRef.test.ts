import { FieldRef, isFieldRef } from "../../../util/filterConditions/fieldRef";

describe("FieldRef", () => {
  test("should store modelName and name", () => {
    const ref = new FieldRef("User", "lastName");
    expect(ref.modelName).toBe("User");
    expect(ref.name).toBe("lastName");
  });

  test("should have readonly properties", () => {
    const ref = new FieldRef("Post", "title");
    expect(ref.modelName).toBe("Post");
    expect(ref.name).toBe("title");
  });
});

describe("isFieldRef", () => {
  test("should return true for FieldRef instance", () => {
    const ref = new FieldRef("User", "email");
    expect(isFieldRef(ref)).toBe(true);
  });

  test("should return false for plain object", () => {
    const obj = { modelName: "User", name: "email" };
    expect(isFieldRef(obj)).toBe(false);
  });

  test("should return false for string", () => {
    expect(isFieldRef("test")).toBe(false);
  });

  test("should return false for null", () => {
    expect(isFieldRef(null)).toBe(false);
  });

  test("should return false for undefined", () => {
    expect(isFieldRef(undefined)).toBe(false);
  });

  test("should return false for number", () => {
    expect(isFieldRef(42)).toBe(false);
  });
});
