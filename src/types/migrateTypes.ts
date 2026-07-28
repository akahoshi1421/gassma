type MigrateModel = {
  name: string;
  columns: string[];
};

type MigrateSheetsOptions = {
  spreadsheetId?: string;
  models: MigrateModel[];
};

export type { MigrateModel, MigrateSheetsOptions };
