import { GassmaMissingArgumentError } from "./errors/argument/argumentError";
import {
  GassmaFindSelectOmitConflictError,
  NotFoundError,
} from "./errors/find/findError";
import { GassmaIncludeSelectConflictError } from "./errors/relation/relationError";
import { IncludeWithoutRelationsError } from "./errors/relation/relationValidationError";
import type { AggregateData } from "./types/aggregateType";
import type {
  AnyUse,
  Omit,
  QueryOmit,
  Select,
  WhereUse,
} from "./types/coreTypes";
import type { CountData } from "./types/countType";
import type {
  CreateData,
  CreateManyAndReturnData,
  CreateManyData,
} from "./types/createTypes";
import type {
  DeleteData,
  DeleteSingleData,
  FindData,
  FindFirstData,
  UpdateData,
  UpdateSingleData,
  UpsertSingleData,
} from "./types/findTypes";
import type { GassmaControllerUtil } from "./types/gassmaControllerUtilType";
import type { GroupByData } from "./types/groupByType";
import type { RelationContext } from "./types/relationTypes";
import type { SheetIo } from "./types/transactionTypes";
import { aggregateFunc } from "./util/aggregate/aggregate";
import { changeSettingsFunc } from "./util/changeSettings/changeSettings";
import { getTitle } from "./util/core/getTitle";
import { countFunc } from "./util/count/count";
import { createFunc } from "./util/create/create";
import { createManyFunc } from "./util/create/createManyFunc";
import { resolveNestedCreate } from "./util/create/nestedWrite/resolveNestedCreate";
import { applyAutoincrement } from "./util/defaults/applyAutoincrement";
import type { DefaultsForSheet } from "./util/defaults/applyDefaults";
import { applyDefaults } from "./util/defaults/applyDefaults";
import { applyUpdatedAt } from "./util/defaults/applyUpdatedAt";
import { generateAutoincrementValues } from "./util/defaults/generateAutoincrementValues";
import { deleteFunc } from "./util/delete/delete";
import { deleteManyFunc } from "./util/delete/deleteMany";
import { FieldRef } from "./util/filterConditions/fieldRef";
import { findFirstFunc } from "./util/find/findFirst";
import { findFirstWithRelationOrderBy } from "./util/find/findFirstWithRelationOrderBy";
import { findManyFunc } from "./util/find/findMany";
import { findManyWithRelationOrderBy } from "./util/find/findManyWithRelationOrderBy";
import { applySelectCount } from "./util/find/findUtil/applySelectCount";
import { applySelectRelations } from "./util/find/findUtil/applySelectRelations";
import { extractSelectRelations } from "./util/find/findUtil/extractSelectRelations";
import { findedDataSelect } from "./util/find/findUtil/findDataSelect";
import { omitFunc } from "./util/find/findUtil/omit";
import { separateRelationOrderBy } from "./util/find/findUtil/separateRelationOrderBy";
import { groupByFunc } from "./util/groupby/groupby";
import { stripIgnoredFields } from "./util/ignore/stripIgnoredFields";
import { stripIgnoreFromSelect } from "./util/ignore/stripIgnoreFromSelect";
import type { FieldMapping } from "./util/map/mapFields";
import { resolveGlobalOmit } from "./util/omit/resolveGlobalOmit";
import {
  applyReadCache,
  runWithoutReadCache,
  runWithReadCache,
} from "./util/read/readCacheContext";
import type { SheetReader } from "./util/read/sheetReader";
import { immediateSheetReader } from "./util/read/sheetReader";
import { resolveOnDelete } from "./util/relation/onDelete/resolveOnDelete";
import { resolveOnUpdate } from "./util/relation/onUpdate/resolveOnUpdate";
import { resolveCount } from "./util/relation/resolveCount";
import { resolveInclude } from "./util/relation/resolveInclude";
import { resolveWhereRelation } from "./util/relation/whereRelation/resolveWhereRelation";
import { normalizeQueryInput } from "./util/skip/normalizeQueryInput";
import { validateOrderByKeys } from "./util/validate/validateOrderByKeys";
import {
  type ValidatedOperation,
  validateTopLevelKeys,
} from "./util/validate/validateTopLevelKeys";
import {
  validateCreateDataOperations,
  validateUpdateDataOperations,
} from "./util/validate/validateDataOperations";
import { validateUpdateColumnsEarly } from "./util/validate/validateUpdateColumnsEarly";
import { resolveNestedUpdate } from "./util/update/nestedWrite/resolveNestedUpdate";
import { resolveNumberOperations } from "./util/update/resolveNumberOperation";
import { updateManyFunc } from "./util/update/updateMany";
import { upsertFunc } from "./util/upsert/upsert";
import type { SheetWriter } from "./util/write/sheetWriter";
import { immediateSheetWriter } from "./util/write/sheetWriter";

class GassmaController {
  private readonly sheet: GoogleAppsScript.Spreadsheet.Sheet;
  private readonly spreadsheetId: string;
  private startRowNumber: number = 1;
  private startColumnNumber: number = 1;
  private endColumnNumber: number = 1;
  private relationContext: RelationContext | null = null;
  private globalOmit: Omit | null = null;
  private defaults: DefaultsForSheet | null = null;
  private updatedAtFields: string[] | null = null;
  private autoincrementFields: string[] | null = null;
  private ignoredFields: string[] | null = null;
  private fieldMapping: FieldMapping | null = null;
  private codeName: string | null = null;
  private strictUndefinedChecks: boolean = false;
  private writer: SheetWriter = immediateSheetWriter;
  private reader: SheetReader = immediateSheetReader;

  constructor(sheetName: string, id?: string, sheetIo?: SheetIo) {
    const spreadSheet = id
      ? SpreadsheetApp.openById(id)
      : SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadSheet.getSheetByName(sheetName);

    if (!sheet)
      throw new Error(`Error: cant access sheet. sheetName: ${sheetName}`);

    if (sheetIo) {
      this.writer = sheetIo.writer;
      this.reader = sheetIo.reader;
    }

    this.sheet = sheet;
    this.spreadsheetId = spreadSheet.getId();

    this.endColumnNumber = this.sheet.getLastColumn();
  }

  public _setRelationContext(context: RelationContext) {
    this.relationContext = context;
  }

  public _getRelationTargets(): { [relationName: string]: string } {
    const targets: { [relationName: string]: string } = {};
    const relations = this.relationContext?.relations;
    if (!relations) return targets;
    Object.keys(relations).forEach((name) => {
      targets[name] = relations[name].to;
    });
    return targets;
  }

  public _setGlobalOmit(omit: Omit) {
    this.globalOmit = omit;
  }

  public _setDefaults(defaults: DefaultsForSheet) {
    this.defaults = defaults;
  }

  public _setUpdatedAt(fields: string[]) {
    this.updatedAtFields = fields;
  }

  public _setAutoincrement(fields: string[]) {
    this.autoincrementFields = fields;
  }

  public _setIgnore(fields: string[]) {
    this.ignoredFields = fields;
  }

  public _getIgnoredFields(): string[] {
    return this.ignoredFields ?? [];
  }

  public _setMap(mapping: FieldMapping) {
    this.fieldMapping = mapping;
  }

  public _setCodeName(name: string) {
    this.codeName = name;
  }

  public _setStrictUndefinedChecks(enabled: boolean) {
    this.strictUndefinedChecks = enabled;
  }

  private normalizeInput<T>(input: T, operation: ValidatedOperation): T;
  private normalizeInput(
    input: unknown,
    operation: ValidatedOperation,
  ): unknown {
    const normalized = normalizeQueryInput(
      input === undefined ? {} : input,
      this.strictUndefinedChecks,
    );
    validateTopLevelKeys(operation, normalized);
    return normalized;
  }

  private relationNames(): string[] {
    return this.relationContext
      ? Object.keys(this.relationContext.relations)
      : [];
  }

  private stripIgnored(data: Record<string, unknown>): Record<string, unknown> {
    if (!this.ignoredFields) return data;
    return stripIgnoredFields(data, this.ignoredFields);
  }

  private applyIgnoreToSelect(
    select: Record<string, unknown>,
  ): Record<string, unknown> {
    if (!this.ignoredFields) return select;
    return stripIgnoreFromSelect(select, this.ignoredFields);
  }

  private mergeIgnoreIntoOmit(omit: Omit | null | undefined): Omit | undefined {
    if (!this.ignoredFields) return omit ?? undefined;
    const merged: Omit = omit ? { ...omit } : {};
    this.ignoredFields.forEach((field) => {
      merged[field] = true;
    });
    return merged;
  }

  private applyUpdatedAtToData(
    data: Record<string, unknown>,
  ): Record<string, unknown> {
    if (!this.updatedAtFields) return data;
    return applyUpdatedAt(data, this.updatedAtFields);
  }

  private applyDefaultsToData(
    data: Record<string, unknown>,
  ): Record<string, unknown> {
    if (!this.defaults) return data;
    return applyDefaults(data, this.defaults);
  }

  private prepareCreateData(
    data: Record<string, unknown>,
  ): Record<string, unknown> {
    return this.stripIgnored(
      this.applyUpdatedAtToData(
        this.applyDefaultsToData(this.applyAutoincrementToData(data)),
      ),
    );
  }

  private applyAutoincrementToData(
    data: Record<string, unknown>,
  ): Record<string, unknown> {
    if (!this.autoincrementFields) return data;
    const keyBase = `${this.spreadsheetId}_${this.sheet.getName()}`;
    const values = generateAutoincrementValues(
      this.autoincrementFields,
      keyBase,
    );
    return applyAutoincrement(
      data,
      this.autoincrementFields,
      values as Record<string, number>,
    );
  }

  public get fields(): Record<string, FieldRef> {
    const modelName = this.codeName ?? this.sheet.getName();
    return new Proxy({} as Record<string, FieldRef>, {
      get: (_target, prop: string) => {
        if (typeof prop !== "string") return undefined;
        return new FieldRef(modelName, prop);
      },
    });
  }

  public getColumnHeaders(): string[] {
    return getTitle(this.getGassmaControllerUtil());
  }

  public changeSettings(
    startRowNumber: number,
    startColumnValue: number | string,
    endColumnValue: number | string,
  ) {
    this.startRowNumber = startRowNumber;
    const { startColumnNumber, endColumnNumber } = changeSettingsFunc(
      startColumnValue,
      endColumnValue,
    );
    this.startColumnNumber = startColumnNumber;
    this.endColumnNumber = endColumnNumber;
  }

  private getGassmaControllerUtil(): GassmaControllerUtil {
    const util: GassmaControllerUtil = {
      sheet: this.sheet,
      startRowNumber: this.startRowNumber,
      startColumnNumber: this.startColumnNumber,
      endColumnNumber: this.endColumnNumber,
      writer: this.writer,
      reader: this.reader,
    };
    if (this.fieldMapping) {
      util.fieldMapping = this.fieldMapping;
    }
    util.whereValidation = {
      ignoredFields: this.ignoredFields ?? [],
      relationNames: this.relationNames(),
    };
    return applyReadCache(util);
  }

  private resolveEffectiveOmit(
    select: Record<string, unknown> | null | undefined,
    queryOmit: QueryOmit | null | undefined,
  ): Omit | null {
    return resolveGlobalOmit(this.globalOmit, select, queryOmit);
  }

  private applyOmitToResult(
    result: Record<string, unknown>,
    effectiveOmit: Omit | null,
  ): Record<string, unknown> {
    if (!effectiveOmit) return result;
    return omitFunc(effectiveOmit, result);
  }

  private resolveWhere(where: WhereUse | undefined): WhereUse | undefined {
    if (!where) return where;
    return resolveWhereRelation(where, this.relationContext);
  }

  private buildScalarSelect(select: Record<string, unknown>): Select | null {
    const scalarKeys = Object.keys(select).filter((key) => key !== "_count");
    if (scalarKeys.length === 0) return null;
    const result: Select = {};
    scalarKeys.forEach((key) => {
      result[key] = true;
    });
    return result;
  }

  private applyCreateManyPreprocess(
    createdData: CreateManyData,
  ): CreateManyData {
    if (
      !this.defaults &&
      !this.updatedAtFields &&
      !this.ignoredFields &&
      !this.autoincrementFields
    )
      return createdData;
    const defs = this.defaults;
    const uaFields = this.updatedAtFields;
    const ignored = this.ignoredFields;
    const aiFields = this.autoincrementFields;
    const aiValues = aiFields
      ? generateAutoincrementValues(
          aiFields,
          `${this.spreadsheetId}_${this.sheet.getName()}`,
          createdData.data.length,
        )
      : null;
    return {
      ...createdData,
      data: createdData.data.map((d, index) => {
        let result: Record<string, unknown> = { ...d };
        if (aiFields && aiValues) {
          const rowValues: Record<string, number> = {};
          aiFields.forEach((field) => {
            const v = aiValues[field];
            rowValues[field] = Array.isArray(v) ? v[index] : v;
          });
          result = applyAutoincrement(result, aiFields, rowValues);
        }
        if (defs) result = applyDefaults(result, defs);
        if (uaFields) result = applyUpdatedAt(result, uaFields);
        if (ignored) result = stripIgnoredFields(result, ignored);
        return result as AnyUse;
      }),
    };
  }

  public createMany(createdData: CreateManyData) {
    return runWithoutReadCache(() => this.createManyRaw(createdData));
  }

  private createManyRaw(createdData: CreateManyData) {
    createdData = this.normalizeInput(createdData, "createMany");
    if (createdData.data === undefined) {
      throw new GassmaMissingArgumentError("data");
    }
    validateCreateDataOperations(createdData.data, this.relationNames());
    return createManyFunc(
      this.getGassmaControllerUtil(),
      createdData,
      false,
      (data) => this.applyCreateManyPreprocess(data),
    );
  }

  public createManyAndReturn(createdData: CreateManyAndReturnData) {
    return runWithoutReadCache(() => this.createManyAndReturnRaw(createdData));
  }

  private createManyAndReturnRaw(createdData: CreateManyAndReturnData) {
    createdData = this.normalizeInput(createdData, "createManyAndReturn");
    if (createdData.data === undefined) {
      throw new GassmaMissingArgumentError("data");
    }
    validateCreateDataOperations(createdData.data, this.relationNames());
    if (createdData.include && createdData.select) {
      throw new GassmaIncludeSelectConflictError();
    }
    if (createdData.include && !this.relationContext) {
      throw new IncludeWithoutRelationsError();
    }
    if (createdData.select && createdData.omit) {
      throw new GassmaFindSelectOmitConflictError();
    }

    const results = createManyFunc(
      this.getGassmaControllerUtil(),
      createdData,
      true,
      (data) => this.applyCreateManyPreprocess(data),
    );
    if (!Array.isArray(results)) return results;

    const stripped = results.map((r) => this.stripIgnored(r));

    if (createdData.include && this.relationContext) {
      const resolved = resolveInclude(
        stripped,
        createdData.include,
        this.relationContext,
      );
      const includeOmit = this.resolveEffectiveOmit(null, createdData.omit);
      return resolved.map((r) => this.applyOmitToResult(r, includeOmit));
    }

    if (createdData.select) {
      return stripped.map((r) => findedDataSelect(createdData.select!, r));
    }

    const effectiveOmit = this.resolveEffectiveOmit(null, createdData.omit);
    return stripped.map((r) => this.applyOmitToResult(r, effectiveOmit));
  }

  public create(createdData: CreateData) {
    return runWithoutReadCache(() => this.createRaw(createdData));
  }

  private createRaw(createdData: CreateData) {
    createdData = this.normalizeInput(createdData, "create");
    if (createdData.data === undefined) {
      throw new GassmaMissingArgumentError("data");
    }
    validateCreateDataOperations(createdData.data, this.relationNames());
    if (createdData.include && createdData.select) {
      throw new GassmaIncludeSelectConflictError();
    }
    if (createdData.include && !this.relationContext) {
      throw new IncludeWithoutRelationsError();
    }
    if (createdData.select && createdData.omit) {
      throw new GassmaFindSelectOmitConflictError();
    }

    const util = this.getGassmaControllerUtil();
    const wrappedCreate = (data: Record<string, unknown>, titles?: string[]) =>
      createFunc(util, { data: data as AnyUse }, titles);
    const result = resolveNestedCreate(
      createdData.data,
      wrappedCreate,
      this.relationContext ?? undefined,
      {
        getTitles: () => getTitle(util),
        validation: util.whereValidation,
        prepare: (data) => this.prepareCreateData(data),
      },
    );

    const mapped = this.stripIgnored(result);

    if (createdData.include && this.relationContext) {
      const resolved = resolveInclude(
        [mapped],
        createdData.include,
        this.relationContext,
      );
      const included = resolved[0] ?? mapped;
      return this.applyOmitToResult(
        included,
        this.resolveEffectiveOmit(null, createdData.omit),
      );
    }

    if (createdData.select) return findedDataSelect(createdData.select, mapped);
    const effectiveOmit = this.resolveEffectiveOmit(null, createdData.omit);
    return this.applyOmitToResult(mapped, effectiveOmit);
  }

  public findFirst(findData: FindFirstData = {}) {
    return runWithReadCache(() =>
      this.findFirstRaw(this.normalizeInput(findData, "findFirst")),
    );
  }

  private findFirstRaw(findData: FindFirstData) {
    if (findData.include && findData.select) {
      throw new GassmaIncludeSelectConflictError();
    }
    if (
      (findData.include || (findData.select && "_count" in findData.select)) &&
      !this.relationContext
    ) {
      throw new IncludeWithoutRelationsError();
    }

    if (findData.select && findData.omit) {
      throw new GassmaFindSelectOmitConflictError();
    }

    const resolvedSelect = findData.select
      ? this.applyIgnoreToSelect(findData.select)
      : findData.select;
    const effectiveOmit = findData.select
      ? undefined
      : this.mergeIgnoreIntoOmit(
          this.resolveEffectiveOmit(findData.select, findData.omit),
        );
    findData = {
      ...findData,
      where: this.resolveWhere(findData.where),
      select: resolvedSelect,
      omit: effectiveOmit,
    };

    const orderBy = "orderBy" in findData ? findData.orderBy : null;
    const orderByArr = orderBy
      ? Array.isArray(orderBy)
        ? orderBy
        : [orderBy]
      : [];
    if (orderByArr.length > 0) {
      validateOrderByKeys(
        orderByArr,
        this.getColumnHeaders(),
        this.relationNames(),
      );
    }
    const { hasRelationOrderBy } = separateRelationOrderBy(orderByArr);

    if (hasRelationOrderBy && this.relationContext) {
      const ffRelationNames = Object.keys(this.relationContext.relations);
      const ffExtracted = findData.select
        ? extractSelectRelations(findData.select, ffRelationNames)
        : null;
      const ffHasSelectRelations =
        ffExtracted?.relationInclude !== null &&
        ffExtracted?.relationInclude !== undefined;
      const ffHasCount =
        findData.select !== undefined && "_count" in findData.select;
      const ffStripSelect = ffHasSelectRelations || ffHasCount;

      const baseResult = findFirstWithRelationOrderBy(
        this.getGassmaControllerUtil(),
        {
          ...findData,
          select: ffStripSelect ? undefined : findData.select,
        },
        this.relationContext,
        orderByArr,
      );

      if (!baseResult) return null;

      if (ffHasSelectRelations && ffExtracted?.relationInclude) {
        const countValue = ffHasCount ? findData.select!._count : undefined;

        let result = resolveInclude(
          [baseResult],
          ffExtracted.relationInclude,
          this.relationContext,
        );

        if (countValue !== undefined) {
          result = resolveCount(result, countValue, this.relationContext);
        }

        const filtered = applySelectRelations(
          result,
          ffExtracted.scalarSelect,
          Object.keys(ffExtracted.relationInclude),
          countValue,
        );
        return filtered[0] ?? null;
      }

      if (ffHasCount) {
        const countValue = findData.select!._count;
        const scalarSelect = this.buildScalarSelect(findData.select!);
        const resolved = applySelectCount(
          [baseResult],
          countValue,
          scalarSelect,
          this.relationContext,
        );
        return resolved[0] ?? null;
      }

      if (findData.include) {
        const resolved = resolveInclude(
          [baseResult],
          findData.include,
          this.relationContext,
        );
        return resolved[0] ?? null;
      }

      return baseResult;
    }

    if (findData.select && this.relationContext) {
      const ffRelationNames2 = Object.keys(this.relationContext.relations);
      const ffExtracted2 = extractSelectRelations(
        findData.select,
        ffRelationNames2,
      );

      if (ffExtracted2.relationInclude) {
        const countValue =
          "_count" in findData.select ? findData.select._count : undefined;

        const fullResult = findFirstFunc(this.getGassmaControllerUtil(), {
          ...findData,
          select: undefined,
        });

        if (!fullResult) return null;

        let result = resolveInclude(
          [fullResult],
          ffExtracted2.relationInclude,
          this.relationContext,
        );

        if (countValue !== undefined) {
          result = resolveCount(result, countValue, this.relationContext);
        }

        const filtered = applySelectRelations(
          result,
          ffExtracted2.scalarSelect,
          Object.keys(ffExtracted2.relationInclude),
          countValue,
        );
        return filtered[0] ?? null;
      }

      if ("_count" in findData.select) {
        const countValue = findData.select._count;
        const scalarSelect = this.buildScalarSelect(findData.select);

        const fullResult = findFirstFunc(this.getGassmaControllerUtil(), {
          ...findData,
          select: undefined,
        });

        if (!fullResult) return null;

        const resolved = applySelectCount(
          [fullResult],
          countValue,
          scalarSelect,
          this.relationContext,
        );
        return resolved[0] ?? null;
      }
    }

    const baseResult = findFirstFunc(this.getGassmaControllerUtil(), findData);

    if (!baseResult || !findData.include || !this.relationContext) {
      return baseResult;
    }

    const resolved = resolveInclude(
      [baseResult],
      findData.include,
      this.relationContext,
    );
    return resolved[0] ?? null;
  }

  public findFirstOrThrow(findData: FindFirstData = {}) {
    const result = this.findFirst(findData);
    if (!result) {
      throw new NotFoundError();
    }
    return result;
  }

  public findMany(findData: FindData = {}) {
    return runWithReadCache(() =>
      this.findManyRaw(this.normalizeInput(findData, "findMany")),
    );
  }

  private findManyRaw(findData: FindData) {
    if (findData.include && findData.select) {
      throw new GassmaIncludeSelectConflictError();
    }
    if (
      (findData.include || (findData.select && "_count" in findData.select)) &&
      !this.relationContext
    ) {
      throw new IncludeWithoutRelationsError();
    }

    if (findData.select && findData.omit) {
      throw new GassmaFindSelectOmitConflictError();
    }

    const fmResolvedSelect = findData.select
      ? this.applyIgnoreToSelect(findData.select)
      : findData.select;
    const fmEffectiveOmit = findData.select
      ? undefined
      : this.mergeIgnoreIntoOmit(
          this.resolveEffectiveOmit(findData.select, findData.omit),
        );
    findData = {
      ...findData,
      where: this.resolveWhere(findData.where),
      select: fmResolvedSelect,
      omit: fmEffectiveOmit,
    };

    const fmOrderBy = "orderBy" in findData ? findData.orderBy : null;
    const fmOrderByArr = fmOrderBy
      ? Array.isArray(fmOrderBy)
        ? fmOrderBy
        : [fmOrderBy]
      : [];
    if (fmOrderByArr.length > 0) {
      validateOrderByKeys(
        fmOrderByArr,
        this.getColumnHeaders(),
        this.relationNames(),
      );
    }
    const { hasRelationOrderBy: fmHasRelation } =
      separateRelationOrderBy(fmOrderByArr);

    if (fmHasRelation && this.relationContext) {
      const fmRelationNames = Object.keys(this.relationContext.relations);
      const fmExtracted = findData.select
        ? extractSelectRelations(findData.select, fmRelationNames)
        : null;
      const fmHasSelectRelations =
        fmExtracted?.relationInclude !== null &&
        fmExtracted?.relationInclude !== undefined;
      const fmHasCount =
        findData.select !== undefined && "_count" in findData.select;
      const fmStripSelect = fmHasSelectRelations || fmHasCount;

      const baseResult = findManyWithRelationOrderBy(
        this.getGassmaControllerUtil(),
        {
          ...findData,
          select: fmStripSelect ? undefined : findData.select,
        },
        this.relationContext,
        fmOrderByArr,
      );

      if (fmHasSelectRelations && fmExtracted?.relationInclude) {
        const countValue = fmHasCount ? findData.select!._count : undefined;

        let result = resolveInclude(
          baseResult,
          fmExtracted.relationInclude,
          this.relationContext,
        );

        if (countValue !== undefined) {
          result = resolveCount(result, countValue, this.relationContext);
        }

        return applySelectRelations(
          result,
          fmExtracted.scalarSelect,
          Object.keys(fmExtracted.relationInclude),
          countValue,
        );
      }

      if (fmHasCount) {
        const countValue = findData.select!._count;
        const scalarSelect = this.buildScalarSelect(findData.select!);
        return applySelectCount(
          baseResult,
          countValue,
          scalarSelect,
          this.relationContext,
        );
      }

      if (findData.include) {
        return resolveInclude(
          baseResult,
          findData.include,
          this.relationContext,
        );
      }

      return baseResult;
    }

    if (findData.select && this.relationContext) {
      const relationNames = Object.keys(this.relationContext.relations);
      const extracted = extractSelectRelations(findData.select, relationNames);

      if (extracted.relationInclude) {
        const countValue =
          "_count" in findData.select ? findData.select._count : undefined;

        const fullRecords = findManyFunc(this.getGassmaControllerUtil(), {
          ...findData,
          select: undefined,
        });

        let result = resolveInclude(
          fullRecords,
          extracted.relationInclude,
          this.relationContext,
        );

        if (countValue !== undefined) {
          result = resolveCount(result, countValue, this.relationContext);
        }

        return applySelectRelations(
          result,
          extracted.scalarSelect,
          Object.keys(extracted.relationInclude),
          countValue,
        );
      }

      if ("_count" in findData.select) {
        const countValue = findData.select._count;
        const scalarSelect = this.buildScalarSelect(findData.select);

        const fullRecords = findManyFunc(this.getGassmaControllerUtil(), {
          ...findData,
          select: undefined,
        });

        return applySelectCount(
          fullRecords,
          countValue,
          scalarSelect,
          this.relationContext,
        );
      }
    }

    const baseResult = findManyFunc(this.getGassmaControllerUtil(), findData);

    if (!findData.include || !this.relationContext) {
      return baseResult;
    }

    return resolveInclude(baseResult, findData.include, this.relationContext);
  }

  public update(updateData: UpdateSingleData) {
    return runWithoutReadCache(() => this.updateRaw(updateData));
  }

  private updateRaw(updateData: UpdateSingleData) {
    updateData = this.normalizeInput(updateData, "update");
    if (updateData.where === undefined) {
      throw new GassmaMissingArgumentError("where");
    }
    if (updateData.data === undefined) {
      throw new GassmaMissingArgumentError("data");
    }
    validateUpdateDataOperations(updateData.data, this.relationNames());
    if (updateData.include && updateData.select) {
      throw new GassmaIncludeSelectConflictError();
    }
    if (updateData.include && !this.relationContext) {
      throw new IncludeWithoutRelationsError();
    }
    if (updateData.select && updateData.omit) {
      throw new GassmaFindSelectOmitConflictError();
    }

    const resolvedWhere =
      this.resolveWhere(updateData.where) ?? updateData.where;

    let precomputedTitles: string[] | undefined;
    if (this.relationContext) {
      const beforeRecords = findManyFunc(this.getGassmaControllerUtil(), {
        where: resolvedWhere,
        take: 1,
      });
      if (beforeRecords.length > 0) {
        precomputedTitles = validateUpdateColumnsEarly(
          this.getGassmaControllerUtil(),
          updateData.data,
          this.relationContext,
          "update",
        );
        const predictedAfter = resolveNumberOperations(
          beforeRecords[0],
          updateData.data,
        );
        resolveOnUpdate(beforeRecords, [predictedAfter], this.relationContext);
      }
    }

    const updateDataProcessed = this.applyUpdatedAtToData(updateData.data);

    const result = resolveNestedUpdate(
      this.getGassmaControllerUtil(),
      { where: resolvedWhere, data: updateDataProcessed },
      this.relationContext ?? undefined,
      precomputedTitles,
    );
    if (!result) return null;

    const stripped = this.stripIgnored(result);

    if (updateData.include && this.relationContext) {
      const resolved = resolveInclude(
        [stripped],
        updateData.include,
        this.relationContext,
      );
      const included = resolved[0] ?? stripped;
      return this.applyOmitToResult(
        included,
        this.resolveEffectiveOmit(null, updateData.omit),
      );
    }

    if (updateData.select) return findedDataSelect(updateData.select, stripped);
    const effectiveOmit = this.resolveEffectiveOmit(null, updateData.omit);
    return this.applyOmitToResult(stripped, effectiveOmit);
  }

  public updateMany(updateData: UpdateData) {
    return runWithoutReadCache(() => this.updateManyRaw(updateData));
  }

  private updateManyRaw(updateData: UpdateData) {
    updateData = this.normalizeInput(updateData, "updateMany");
    if (updateData.data === undefined) {
      throw new GassmaMissingArgumentError("data");
    }
    validateUpdateDataOperations(updateData.data, this.relationNames());
    updateData = {
      ...updateData,
      where: this.resolveWhere(updateData.where),
      data: this.applyUpdatedAtToData(updateData.data),
    };

    let precomputedTitles: string[] | undefined;
    if (this.relationContext) {
      precomputedTitles = validateUpdateColumnsEarly(
        this.getGassmaControllerUtil(),
        updateData.data,
        this.relationContext,
        "updateMany",
      );
      const findData: FindData = { where: updateData.where };
      if (updateData.limit !== undefined && updateData.limit !== null) {
        findData.take = updateData.limit;
      }
      const beforeRecords = findManyFunc(
        this.getGassmaControllerUtil(),
        findData,
      );
      const predictedAfterRecords = beforeRecords.map((r) =>
        resolveNumberOperations(r, updateData.data),
      );
      resolveOnUpdate(
        beforeRecords,
        predictedAfterRecords,
        this.relationContext,
      );
    }

    return updateManyFunc(
      this.getGassmaControllerUtil(),
      updateData,
      false,
      precomputedTitles,
    );
  }

  public updateManyAndReturn(updateData: UpdateData) {
    return runWithoutReadCache(() => this.updateManyAndReturnRaw(updateData));
  }

  private updateManyAndReturnRaw(updateData: UpdateData) {
    updateData = this.normalizeInput(updateData, "updateManyAndReturn");
    if (updateData.data === undefined) {
      throw new GassmaMissingArgumentError("data");
    }
    validateUpdateDataOperations(updateData.data, this.relationNames());
    updateData = {
      ...updateData,
      where: this.resolveWhere(updateData.where),
      data: this.applyUpdatedAtToData(updateData.data),
    };

    let precomputedTitles: string[] | undefined;
    if (this.relationContext) {
      precomputedTitles = validateUpdateColumnsEarly(
        this.getGassmaControllerUtil(),
        updateData.data,
        this.relationContext,
        "updateMany",
      );
      const findData: FindData = { where: updateData.where };
      if (updateData.limit !== undefined && updateData.limit !== null) {
        findData.take = updateData.limit;
      }
      const beforeRecords = findManyFunc(
        this.getGassmaControllerUtil(),
        findData,
      );
      const predictedAfterRecords = beforeRecords.map((r) =>
        resolveNumberOperations(r, updateData.data),
      );
      resolveOnUpdate(
        beforeRecords,
        predictedAfterRecords,
        this.relationContext,
      );
    }

    const results = updateManyFunc(
      this.getGassmaControllerUtil(),
      updateData,
      true,
      precomputedTitles,
    );
    if (!Array.isArray(results)) return results;
    return results.map((r) => {
      const stripped = this.stripIgnored(r);
      return this.applyOmitToResult(stripped, this.globalOmit);
    });
  }

  public upsert(upsertData: UpsertSingleData) {
    return runWithoutReadCache(() => this.upsertRaw(upsertData));
  }

  private upsertRaw(upsertData: UpsertSingleData) {
    upsertData = this.normalizeInput(upsertData, "upsert");
    if (upsertData.where === undefined) {
      throw new GassmaMissingArgumentError("where");
    }
    if (upsertData.create === undefined) {
      throw new GassmaMissingArgumentError("create");
    }
    if (upsertData.update === undefined) {
      throw new GassmaMissingArgumentError("update");
    }
    validateCreateDataOperations(upsertData.create, this.relationNames());
    validateUpdateDataOperations(upsertData.update, this.relationNames());
    if (upsertData.include && upsertData.select) {
      throw new GassmaIncludeSelectConflictError();
    }
    if (upsertData.include && !this.relationContext) {
      throw new IncludeWithoutRelationsError();
    }
    if (upsertData.select && upsertData.omit) {
      throw new GassmaFindSelectOmitConflictError();
    }

    const resolvedWhere =
      this.resolveWhere(upsertData.where) ?? upsertData.where;
    const upsertOmit = this.resolveEffectiveOmit(
      upsertData.select,
      upsertData.omit,
    );

    const updateWithTimestamp = this.applyUpdatedAtToData(upsertData.update);
    const upsertOmitWithIgnore = this.mergeIgnoreIntoOmit(upsertOmit);

    return upsertFunc(
      this.getGassmaControllerUtil(),
      {
        ...upsertData,
        where: resolvedWhere,
        update: updateWithTimestamp as AnyUse,
        omit: upsertOmitWithIgnore,
      },
      this.relationContext,
      (data) => this.prepareCreateData(data),
    );
  }

  public delete(deleteData: DeleteSingleData) {
    return runWithoutReadCache(() => this.deleteRaw(deleteData));
  }

  private deleteRaw(deleteData: DeleteSingleData) {
    deleteData = this.normalizeInput(deleteData, "delete");
    if (deleteData.where === undefined) {
      throw new GassmaMissingArgumentError("where");
    }
    if (deleteData.include && deleteData.select) {
      throw new GassmaIncludeSelectConflictError();
    }
    if (deleteData.include && !this.relationContext) {
      throw new IncludeWithoutRelationsError();
    }
    if (deleteData.select && deleteData.omit) {
      throw new GassmaFindSelectOmitConflictError();
    }

    const resolvedWhere =
      this.resolveWhere(deleteData.where) ?? deleteData.where;
    const deleteOmit = this.mergeIgnoreIntoOmit(
      this.resolveEffectiveOmit(deleteData.select, deleteData.omit),
    );

    return deleteFunc(
      this.getGassmaControllerUtil(),
      {
        ...deleteData,
        where: resolvedWhere,
        omit: deleteOmit,
      },
      this.relationContext,
    );
  }

  public deleteMany(deleteData: DeleteData = {}) {
    return runWithoutReadCache(() => this.deleteManyRaw(deleteData));
  }

  private deleteManyRaw(deleteData: DeleteData) {
    deleteData = this.normalizeInput(deleteData, "deleteMany");
    deleteData = { ...deleteData, where: this.resolveWhere(deleteData.where) };

    if (this.relationContext) {
      const findData: FindData = { where: deleteData.where };
      if (deleteData.limit !== undefined && deleteData.limit !== null) {
        findData.take = deleteData.limit;
      }
      const records = findManyFunc(this.getGassmaControllerUtil(), findData);
      resolveOnDelete(records, this.relationContext);
    }

    return deleteManyFunc(this.getGassmaControllerUtil(), deleteData);
  }

  public aggregate(aggregateData: AggregateData) {
    return runWithReadCache(() =>
      this.aggregateRaw(this.normalizeInput(aggregateData, "aggregate")),
    );
  }

  private aggregateRaw(aggregateData: AggregateData) {
    aggregateData = {
      ...aggregateData,
      where: this.resolveWhere(aggregateData.where),
    };
    return aggregateFunc(this.getGassmaControllerUtil(), aggregateData);
  }

  public count(countData: CountData = {}) {
    return runWithReadCache(() =>
      this.countRaw(this.normalizeInput(countData, "count")),
    );
  }

  private countRaw(countData: CountData) {
    countData = { ...countData, where: this.resolveWhere(countData.where) };
    return countFunc(this.getGassmaControllerUtil(), countData);
  }

  public groupBy(groupByData: GroupByData) {
    return runWithReadCache(() =>
      this.groupByRaw(this.normalizeInput(groupByData, "groupBy")),
    );
  }

  private groupByRaw(groupByData: GroupByData) {
    if (groupByData.by === undefined) {
      throw new GassmaMissingArgumentError("by");
    }
    groupByData = {
      ...groupByData,
      where: this.resolveWhere(groupByData.where),
    };
    return groupByFunc(this.getGassmaControllerUtil(), groupByData);
  }
}

export { GassmaController };
