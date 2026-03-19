import type { UpdateAnyUse, WhereUse } from "../../../types/coreTypes";
import type { GassmaControllerUtil } from "../../../types/gassmaControllerUtilType";
import type { RelationContext } from "../../../types/relationTypes";
import { NestedWriteWithoutRelationsError } from "../../../errors/relation/nestedWriteError";
import { getTitle } from "../../core/getTitle";
import { getWantUpdateIndex } from "../../core/getWantUpdateIndex";
import { whereFilter } from "../../core/whereFilter";
import { processBeforeCreate } from "../../create/nestedWrite/processBeforeCreate";
import { processAfterCreate } from "../../create/nestedWrite/processAfterCreate";
import { processManyToMany } from "../../create/nestedWrite/processManyToMany";
import {
  extractRelationDataForUpdate,
  isUpdateNestedWriteOperation,
} from "./extractRelationDataForUpdate";
import { processBeforeUpdate } from "./processBeforeUpdate";
import { processAfterUpdate } from "./processAfterUpdate";
import { processManyToManyUpdate } from "./processManyToManyUpdate";
import {
  isNumberOperation,
  resolveNumberOperation,
} from "../resolveNumberOperation";
import { escapeFormulaInjectionRow } from "../../core/escapeFormulaInjection";

type UpdateInput = {
  where: WhereUse;
  data: Record<string, unknown>;
};

const hasUpdateNestedWriteFields = (
  data: Record<string, unknown>,
  relationContext: RelationContext | undefined,
): boolean => {
  if (!relationContext) return false;
  return Object.entries(data).some(
    ([key, value]) =>
      key in relationContext.relations && isUpdateNestedWriteOperation(value),
  );
};

const resolveNestedUpdate = (
  util: GassmaControllerUtil,
  updateInput: UpdateInput,
  relationContext: RelationContext | undefined,
): Record<string, unknown> | null => {
  const { sheet, startRowNumber, startColumnNumber, endColumnNumber } = util;
  const matchedRows = whereFilter(updateInput.where, util);

  if (matchedRows.length === 0) return null;

  const firstRow = matchedRows[0];
  const titles = getTitle(util);
  const columnLength = endColumnNumber - startColumnNumber + 1;

  const currentRecord = titles.reduce<Record<string, unknown>>(
    (record, title, index) => {
      record[title] = firstRow.row[index];
      return record;
    },
    {},
  );

  if (!hasUpdateNestedWriteFields(updateInput.data, relationContext)) {
    if (
      !relationContext &&
      Object.values(updateInput.data).some(isUpdateNestedWriteOperation)
    ) {
      throw new NestedWriteWithoutRelationsError();
    }

    const wantUpdateIndex = getWantUpdateIndex(util, {
      data: updateInput.data as UpdateAnyUse,
    });
    const updatedRow = firstRow.row.map((cell, cellIndex) => {
      if (!wantUpdateIndex.includes(cellIndex)) return cell;
      const value = updateInput.data[String(titles[cellIndex])];
      if (isNumberOperation(value)) {
        return resolveNumberOperation(cell, value);
      }
      return value;
    });

    const rowNumber = firstRow.rowNumber + startRowNumber;
    const updateRange = sheet.getRange(
      rowNumber,
      startColumnNumber,
      1,
      columnLength,
    );
    updateRange.setValues([escapeFormulaInjectionRow(updatedRow)]);

    return titles.reduce<Record<string, unknown>>((record, title, index) => {
      record[title] = updatedRow[index];
      return record;
    }, {});
  }

  const { scalarData, relationOps } = extractRelationDataForUpdate(
    updateInput.data,
    relationContext!.relations,
  );

  const enrichedData = processBeforeCreate(
    scalarData,
    relationOps,
    relationContext!,
  );

  processBeforeUpdate(
    currentRecord,
    enrichedData,
    relationOps,
    relationContext!,
  );

  const wantUpdateIndex = getWantUpdateIndex(util, {
    data: enrichedData as UpdateAnyUse,
  });
  const updatedRow = firstRow.row.map((cell, cellIndex) => {
    if (!wantUpdateIndex.includes(cellIndex)) return cell;
    const value = enrichedData[String(titles[cellIndex])];
    if (isNumberOperation(value)) {
      return resolveNumberOperation(cell, value);
    }
    return value;
  });

  const rowNumber = firstRow.rowNumber + startRowNumber;
  const updateRange = sheet.getRange(
    rowNumber,
    startColumnNumber,
    1,
    columnLength,
  );
  updateRange.setValues([escapeFormulaInjectionRow(updatedRow)]);

  const updatedRecord = titles.reduce<Record<string, unknown>>(
    (record, title, index) => {
      record[title] = updatedRow[index];
      return record;
    },
    {},
  );

  processAfterCreate(updatedRecord, relationOps, relationContext!);
  processAfterUpdate(updatedRecord, relationOps, relationContext!);
  processManyToMany(updatedRecord, relationOps, relationContext!);
  processManyToManyUpdate(updatedRecord, relationOps, relationContext!);

  return updatedRecord;
};

export { resolveNestedUpdate };
