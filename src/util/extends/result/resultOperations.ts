import type { GassmaController } from "../../../gassmaController";
import type {
  CreateData,
  CreateManyAndReturnData,
} from "../../../types/createTypes";
import type { ResultFieldRecord } from "../../../types/extendsTypes";
import type {
  DeleteSingleData,
  FindData,
  FindFirstData,
  UpdateData,
  UpdateSingleData,
  UpsertSingleData,
} from "../../../types/findTypes";
import { prepareResultArgs } from "./prepareResultArgs";
import { transformResult } from "./transformResult";

const buildResultOperations = (
  controller: GassmaController,
  fields: ResultFieldRecord,
) => {
  const wrapped =
    <A, R>(execute: (args: A) => R) =>
    (args: A): R => {
      const prepared = prepareResultArgs(args, fields);
      return transformResult(execute(prepared.args), fields, prepared.plan);
    };

  return {
    findFirst: wrapped((a: FindFirstData) => controller.findFirst(a)),
    findFirstOrThrow: wrapped((a: FindFirstData) =>
      controller.findFirstOrThrow(a),
    ),
    findMany: wrapped((a: FindData) => controller.findMany(a)),
    create: wrapped((a: CreateData) => controller.create(a)),
    createManyAndReturn: wrapped((a: CreateManyAndReturnData) =>
      controller.createManyAndReturn(a),
    ),
    update: wrapped((a: UpdateSingleData) => controller.update(a)),
    updateManyAndReturn: wrapped((a: UpdateData) =>
      controller.updateManyAndReturn(a),
    ),
    upsert: wrapped((a: UpsertSingleData) => controller.upsert(a)),
    delete: wrapped((a: DeleteSingleData) => controller.delete(a)),
  };
};

type ResultOperations = ReturnType<typeof buildResultOperations>;

export { buildResultOperations };
export type { ResultOperations };
