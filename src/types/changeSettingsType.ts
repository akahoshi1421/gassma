import { z } from "zod";

type ChangeSettingsData = {
  startRowNumber?: number;
  startColumnValue?: number | string;
  endColumnValue?: number | string;
  schema?: z.ZodObject<{
    [ey: string]: z.ZodTypeAny;
  }>;
};

export { ChangeSettingsData };
