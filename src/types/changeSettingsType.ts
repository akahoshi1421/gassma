import { SchemaType } from "./core/schemaType";

type ChangeSettingsData = {
  startRowNumber?: number;
  startColumnValue?: number | string;
  endColumnValue?: number | string;
  schema?: SchemaType;
};

export { ChangeSettingsData };
