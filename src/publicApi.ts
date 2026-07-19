import * as findErrors from "./errors/find/findError";
import * as nestedWriteErrors from "./errors/relation/nestedWriteError";
import * as relationErrors from "./errors/relation/relationError";
import * as relationValidationErrors from "./errors/relation/relationValidationError";
import * as skipErrors from "./errors/skip/skipError";
import * as updateErrors from "./errors/update/updateError";
import * as whereRelationErrors from "./errors/relation/whereRelationError";
import { GassmaClient as GassmaClientClass } from "./gassma";
import { GassmaController as GassmaControllerClass } from "./gassmaController";
import { FieldRef as FieldRefClass } from "./util/filterConditions/fieldRef";
import { skip as skipSymbol } from "./util/skip/skip";

// GAS ライブラリとして公開する実体。src/index.d.ts の namespace Gassma と 1:1 に保つ。
// gas-webpack-plugin が検出できるのは `exports.X = ...` 代入式のみのため、
// re-export 構文ではなく `export const X = 実体` の形にしている。
export const GassmaClient = GassmaClientClass;
export const GassmaController = GassmaControllerClass;
export const FieldRef = FieldRefClass;
export const skip = skipSymbol;

export const GassmaSkipNegativeError = findErrors.GassmaSkipNegativeError;
export const GassmaFindFirstTakeError = findErrors.GassmaFindFirstTakeError;
export const GassmaLimitNegativeError = findErrors.GassmaLimitNegativeError;
export const NotFoundError = findErrors.NotFoundError;
export const RelationOrderByUnsupportedTypeError =
  findErrors.RelationOrderByUnsupportedTypeError;
export const RelationOrderByCountUnsupportedTypeError =
  findErrors.RelationOrderByCountUnsupportedTypeError;

export const RelationSheetNotFoundError =
  relationValidationErrors.RelationSheetNotFoundError;
export const RelationMissingPropertyError =
  relationValidationErrors.RelationMissingPropertyError;
export const RelationInvalidPropertyTypeError =
  relationValidationErrors.RelationInvalidPropertyTypeError;
export const RelationInvalidTypeError =
  relationValidationErrors.RelationInvalidTypeError;
export const RelationColumnNotFoundError =
  relationValidationErrors.RelationColumnNotFoundError;
export const IncludeWithoutRelationsError =
  relationValidationErrors.IncludeWithoutRelationsError;
export const IncludeInvalidOptionTypeError =
  relationValidationErrors.IncludeInvalidOptionTypeError;
export const IncludeSelectOmitConflictError =
  relationValidationErrors.IncludeSelectOmitConflictError;
export const IncludeSelectIncludeConflictError =
  relationValidationErrors.IncludeSelectIncludeConflictError;
export const RelationInvalidOnDeleteError =
  relationValidationErrors.RelationInvalidOnDeleteError;
export const RelationInvalidOnUpdateError =
  relationValidationErrors.RelationInvalidOnUpdateError;

export const WhereRelationInvalidFilterError =
  whereRelationErrors.WhereRelationInvalidFilterError;
export const WhereRelationWithoutContextError =
  whereRelationErrors.WhereRelationWithoutContextError;

export const RelationOnDeleteRestrictError =
  relationErrors.RelationOnDeleteRestrictError;
export const RelationOnUpdateRestrictError =
  relationErrors.RelationOnUpdateRestrictError;

export const NestedWriteConnectNotFoundError =
  nestedWriteErrors.NestedWriteConnectNotFoundError;
export const NestedWriteRelationNotFoundError =
  nestedWriteErrors.NestedWriteRelationNotFoundError;
export const NestedWriteInvalidOperationError =
  nestedWriteErrors.NestedWriteInvalidOperationError;
export const NestedWriteWithoutRelationsError =
  nestedWriteErrors.NestedWriteWithoutRelationsError;
export const NestedWriteTargetNotFoundError =
  nestedWriteErrors.NestedWriteTargetNotFoundError;

export const GassmaUndefinedValueError = skipErrors.GassmaUndefinedValueError;
export const GassmaSkipInArrayError = skipErrors.GassmaSkipInArrayError;

export const GassmaUpdateWhereMissingError =
  updateErrors.GassmaUpdateWhereMissingError;
