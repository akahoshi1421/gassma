import type { GassmaController } from "../../../gassmaController";
import type { AggregateData } from "../../../types/aggregateType";
import type { CountData } from "../../../types/countType";
import type {
  CreateData,
  CreateManyAndReturnData,
  CreateManyData,
} from "../../../types/createTypes";
import type { QueryHook } from "../../../types/extendsTypes";
import type {
  DeleteData,
  DeleteSingleData,
  FindData,
  FindFirstData,
  UpdateData,
  UpdateSingleData,
  UpsertSingleData,
} from "../../../types/findTypes";
import type { GroupByData } from "../../../types/groupByType";
import { runQueryHooks } from "./runQueryHooks";

type ResolveHooks = (operation: string) => QueryHook[];

const buildHookedOperations = (
  controller: GassmaController,
  model: string,
  resolveHooks: ResolveHooks,
) => {
  const hooked =
    <A, R>(operation: string, execute: (args: A) => R) =>
    (args: A): R =>
      runQueryHooks(resolveHooks(operation), model, operation, args, execute);

  return {
    findFirst: hooked("findFirst", (a: FindFirstData) =>
      controller.findFirst(a),
    ),
    findFirstOrThrow: hooked("findFirstOrThrow", (a: FindFirstData) =>
      controller.findFirstOrThrow(a),
    ),
    findMany: hooked("findMany", (a: FindData) => controller.findMany(a)),
    create: hooked("create", (a: CreateData) => controller.create(a)),
    createMany: hooked("createMany", (a: CreateManyData) =>
      controller.createMany(a),
    ),
    createManyAndReturn: hooked(
      "createManyAndReturn",
      (a: CreateManyAndReturnData) => controller.createManyAndReturn(a),
    ),
    update: hooked("update", (a: UpdateSingleData) => controller.update(a)),
    updateMany: hooked("updateMany", (a: UpdateData) =>
      controller.updateMany(a),
    ),
    updateManyAndReturn: hooked("updateManyAndReturn", (a: UpdateData) =>
      controller.updateManyAndReturn(a),
    ),
    upsert: hooked("upsert", (a: UpsertSingleData) => controller.upsert(a)),
    delete: hooked("delete", (a: DeleteSingleData) => controller.delete(a)),
    deleteMany: hooked("deleteMany", (a: DeleteData) =>
      controller.deleteMany(a),
    ),
    count: hooked("count", (a: CountData) => controller.count(a)),
    aggregate: hooked("aggregate", (a: AggregateData) =>
      controller.aggregate(a),
    ),
    groupBy: hooked("groupBy", (a: GroupByData) => controller.groupBy(a)),
  };
};

type HookedOperations = ReturnType<typeof buildHookedOperations>;

export { buildHookedOperations };
export type { HookedOperations };
