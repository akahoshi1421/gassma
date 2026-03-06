import { FieldRef, isFieldRef } from "../../../util/filterConditions/fieldRef";

describe("FieldRef", () => {
  test("should store modelName and name", () => {
    const ref = new FieldRef("User", "lastName");
    expect(ref.modelName).toBe("User");
    expect(ref.name).toBe("lastName");
  });
});

describe("isFieldRef", () => {
  test("should return true for FieldRef instance", () => {
    expect(isFieldRef(new FieldRef("User", "email"))).toBe(true);
  });

  test("should return false for plain object", () => {
    expect(isFieldRef({ modelName: "User", name: "email" })).toBe(false);
  });

  test("should return false for primitives and null", () => {
    expect(isFieldRef("test")).toBe(false);
    expect(isFieldRef(null)).toBe(false);
    expect(isFieldRef(undefined)).toBe(false);
    expect(isFieldRef(42)).toBe(false);
  });
});
