import type { AnyUse, QueryOmit, WhereUse } from "../../types/coreTypes";
import type { GassmaSheet } from "../../types/gassmaTypes";
import type { IncludeData, RelationsConfig } from "../../types/relationTypes";
import { validateRelationsConfig } from "./validation/validateRelationsConfig";

const injectRelations = (
  relations: RelationsConfig,
  controllers: GassmaSheet,
) => {
  const cache = new Map<string, string[]>();
  const getColumnHeaders = (sheetName: string): string[] => {
    const cached = cache.get(sheetName);
    if (cached) return cached;
    const headers = controllers[sheetName].getColumnHeaders();
    cache.set(sheetName, headers);
    return headers;
  };

  validateRelationsConfig(relations, controllers, getColumnHeaders);

  const findManyOnSheet = (
    sheetName: string,
    findData: { where?: WhereUse; include?: IncludeData; omit?: QueryOmit },
  ): Record<string, unknown>[] => {
    const controller = controllers[sheetName];
    if (!controller) {
      throw new Error(`Target sheet "${sheetName}" is not accessible`);
    }
    return controller.findMany(findData);
  };

  const deleteManyOnSheet = (
    sheetName: string,
    deleteData: { where: WhereUse },
  ): { count: number } => {
    const controller = controllers[sheetName];
    if (!controller) {
      throw new Error(`Target sheet "${sheetName}" is not accessible`);
    }
    return controller.deleteMany(deleteData);
  };

  const updateManyOnSheet = (
    sheetName: string,
    updateData: { where?: WhereUse; data: AnyUse },
  ): { count: number } => {
    const controller = controllers[sheetName];
    if (!controller) {
      throw new Error(`Target sheet "${sheetName}" is not accessible`);
    }
    return controller.updateMany(updateData);
  };

  const createOnSheet = (
    sheetName: string,
    createData: { data: Record<string, unknown> },
  ): Record<string, unknown> => {
    const controller = controllers[sheetName];
    if (!controller) {
      throw new Error(`Target sheet "${sheetName}" is not accessible`);
    }
    return controller.create({ data: createData.data as AnyUse });
  };

  const createManyOnSheet = (
    sheetName: string,
    createManyData: { data: AnyUse[] },
  ): { count: number } | undefined => {
    const controller = controllers[sheetName];
    if (!controller) {
      throw new Error(`Target sheet "${sheetName}" is not accessible`);
    }
    return controller.createMany(createManyData);
  };

  const relationNamesOnSheet = (sheetName: string): string[] =>
    Object.keys(relations[sheetName] ?? {});

  Object.keys(relations).forEach((sheetName) => {
    const controller = controllers[sheetName];
    if (!controller) return;

    controller._setRelationContext({
      relations: relations[sheetName],
      relationNamesOnSheet,
      findManyOnSheet,
      deleteManyOnSheet,
      updateManyOnSheet,
      createOnSheet,
      createManyOnSheet,
    });
  });
};

export { injectRelations };
