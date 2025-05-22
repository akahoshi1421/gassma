import { createValidation } from "../../../app/util/validation/create";
import { schema } from "../../const/testSchema";

describe("createValidation", () => {
  test("should not occor an error createValidation", () => {
    const data = {
      name: "John",
      age: 20,
      postNumber: "111-1111",
      createdAt: new Date(),
    };

    expect(() => createValidation(data, schema)).not.toThrow();
  });

  test("should occor an error createValidation", () => {
    const data = {
      name: 1,
      createdAt: new Date(),
    };

    expect(() => createValidation(data, schema)).toThrow();
  });

  test("should occor an error createValidation 2", () => {
    const data = {
      name: "John",
      createdAt: new Date(),
      invalidKey: true,
    };

    expect(() => createValidation(data, schema)).toThrow();
  });
});
