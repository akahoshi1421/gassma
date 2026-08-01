type MigrateModel = {
  name: string;
  columns: string[];
};

type MigrateSheetsOptions = {
  spreadsheetId?: string;
  models: MigrateModel[];
  acceptDataLoss?: boolean;
};

export type { MigrateModel, MigrateSheetsOptions };
