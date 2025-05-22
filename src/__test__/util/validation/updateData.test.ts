import { updateDataValidation } from "../../../app/util/validation/updateData";
import { schema } from "../../const/testSchema";

describe("updateDataValidation", () => {
  test("should not occor an error updateDataValidation", () => {
    const data = {
      name: "John",
      age: 20,
      postNumber: "111-1111",
      createdAt: new Date(),
    };

    expect(() => updateDataValidation(data, schema)).not.toThrow();
  });

  test("should not occor an error updateDataValidation 2", () => {
    const data = {
      age: 20,
    };

    expect(() => updateDataValidation(data, schema)).not.toThrow();
  });

  test("should occor an error updateDataValidation", () => {
    const data = {
      age: "invalid",
    };

    expect(() => updateDataValidation(data, schema)).toThrow();
  });

  test("should occor an error updateDataValidation 2", () => {
    const data = {
      invalidKey: true,
    };

    expect(() => updateDataValidation(data, schema)).toThrow();
  });
});
