import { createValidation } from "../../../app/util/validation/create";
import { z } from "../../../app/zod";

describe("createValidation", () => {
  const schema = z.object({
    name: z.string(),
    age: z.number().optional().nullable(),
    postNumber: z
      .string()
      .regex(/^\d{3}-\d{4}$/, { message: "XXX-XXXX" })
      .optional()
      .nullable(),
    createdAt: z.date(),
  });

  test("should not error createValidation", () => {
    const data = {
      name: "John",
      age: 20,
      postNumber: "111-1111",
      createdAt: new Date(),
    };

    expect(() => createValidation(data, schema)).not.toThrow();
  });

  test("should error createValidation", () => {
    const data = {
      name: 1,
      createdAt: new Date(),
    };

    expect(() => createValidation(data, schema)).toThrow();
  });
});
