import type { WhereUse } from "../../../types/coreTypes";
import type { GassmaControllerUtil } from "../../../types/gassmaControllerUtilType";
import type { RelationContext } from "../../../types/relationTypes";
import { getTitle } from "../../core/getTitle";
import { getWantUpdateIndexFromTitles } from "../../core/getWantUpdateIndex";
import { whereFilter } from "../../core/whereFilter";
import { processBeforeCreate } from "../../create/nestedWrite/processBeforeCreate";
import { processAfterCreate } from "../../create/nestedWrite/processAfterCreate";
import { processOneToOne } from "../../create/nestedWrite/processOneToOne";
import { processManyToMany } from "../../create/nestedWrite/processManyToMany";
import {
  extractRelationDataForUpdate,
  isUpdateNestedWriteOperation,
} from "./extractRelationDataForUpdate";
import { processBeforeUpdate } from "./processBeforeUpdate";
import { processAfterUpdate } from "./processAfterUpdate";
import { processOneToOneUpdate } from "./processOneToOneUpdate";
import { processManyToManyUpdate } from "./processManyToManyUpdate";
import {
  isNumberOperation,
  resolveNumberOperation,
} from "../resolveNumberOperation";
import { escapeFormulaInjectionRow } from "../../core/escapeFormulaInjection";
import { unwrapRawCell } from "../../raw/raw";
import { validateUpdateColumnsEarly } from "../../validate/validateUpdateColumnsEarly";
import { resolveWriter } from "../../write/sheetWriter";

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
  precomputedTitles?: string[],
): Record<string, unknown> | null => {
  const { sheet, startRowNumber, startColumnNumber, endColumnNumber } = util;
  const titles = precomputedTitles ?? getTitle(util);
  const matchedRows = whereFilter(updateInput.where, util, titles);

  validateUpdateColumnsEarly(
    util,
    updateInput.data,
    relationContext ?? null,
    "update",
    titles,
  );

  if (matchedRows.length === 0) return null;

  const firstRow = matchedRows[0];
  const columnLength = endColumnNumber - startColumnNumber + 1;

  const currentRecord = titles.reduce<Record<string, unknown>>(
    (record, title, index) => {
      record[title] = firstRow.row[index];
      return record;
    },
    {},
  );

  if (!hasUpdateNestedWriteFields(updateInput.data, relationContext)) {
    const wantUpdateIndex = getWantUpdateIndexFromTitles(
      titles,
      updateInput.data,
    );
    const updatedRow = firstRow.row.map((cell, cellIndex) => {
      if (!wantUpdateIndex.includes(cellIndex)) return cell;
      const value = updateInput.data[String(titles[cellIndex])];
      if (isNumberOperation(value)) {
        return resolveNumberOperation(cell, value);
      }
      return value;
    });

    const rowNumber = firstRow.rowNumber + startRowNumber;
    resolveWriter(util.writer).updateRow(
      sheet,
      rowNumber,
      startColumnNumber,
      columnLength,
      escapeFormulaInjectionRow(updatedRow),
    );

    return titles.reduce<Record<string, unknown>>((record, title, index) => {
      record[title] = unwrapRawCell(updatedRow[index]);
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

  const wantUpdateIndex = getWantUpdateIndexFromTitles(titles, enrichedData);
  const updatedRow = firstRow.row.map((cell, cellIndex) => {
    if (!wantUpdateIndex.includes(cellIndex)) return cell;
    const value = enrichedData[String(titles[cellIndex])];
    if (isNumberOperation(value)) {
      return resolveNumberOperation(cell, value);
    }
    return value;
  });

  const rowNumber = firstRow.rowNumber + startRowNumber;
  resolveWriter(util.writer).updateRow(
    sheet,
    rowNumber,
    startColumnNumber,
    columnLength,
    escapeFormulaInjectionRow(updatedRow),
  );

  const updatedRecord = titles.reduce<Record<string, unknown>>(
    (record, title, index) => {
      record[title] = unwrapRawCell(updatedRow[index]);
      return record;
    },
    {},
  );

  processAfterCreate(updatedRecord, relationOps, relationContext!);
  processAfterUpdate(updatedRecord, relationOps, relationContext!);
  processOneToOne(updatedRecord, relationOps, relationContext!);
  processOneToOneUpdate(updatedRecord, relationOps, relationContext!);
  processManyToMany(updatedRecord, relationOps, relationContext!);
  processManyToManyUpdate(updatedRecord, relationOps, relationContext!);

  return updatedRecord;
};

export { resolveNestedUpdate };
