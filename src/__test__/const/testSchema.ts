import { z } from "../../app/zod";

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

export { schema };
