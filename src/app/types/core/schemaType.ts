import { z } from "zod";

type SchemaType =
  | z.ZodObject<{
      [key: string]: z.ZodTypeAny;
    }>
  | undefined;

export { SchemaType };
