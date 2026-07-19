import {
  GassmaAggregateMaxError,
  GassmaAggregateMinError,
} from "../../errors/aggregate/aggregateError";
import { GassmaInValidColumnValueError } from "../../errors/changeSettings/changeSettingsError";
import {
  GassmaFindFirstTakeError,
  NotFoundError,
} from "../../errors/find/findError";
import { GassmaGroupByHavingDontWriteByError } from "../../errors/groupBy/groupByError";
import { NestedWriteTargetNotFoundError } from "../../errors/relation/nestedWriteError";
import { RelationOnDeleteRestrictError } from "../../errors/relation/relationError";
import { GassmaUndefinedValueError } from "../../errors/skip/skipError";

type ErrorCase = {
  className: string;
  ctor: new (
    // biome-ignore lint/suspicious/noExplicitAny: コンストラクタ引数は各ケースの create 側で担保する
    ...args: any[]
  ) => Error;
  create: () => Error;
};

const cases: ErrorCase[] = [
  {
    className: "GassmaFindFirstTakeError",
    ctor: GassmaFindFirstTakeError,
    create: () => new GassmaFindFirstTakeError(),
  },
  {
    className: "NotFoundError",
    ctor: NotFoundError,
    create: () => new NotFoundError(),
  },
  {
    className: "NestedWriteTargetNotFoundError",
    ctor: NestedWriteTargetNotFoundError,
    create: () => new NestedWriteTargetNotFoundError("Users", "update"),
  },
  {
    className: "GassmaUndefinedValueError",
    ctor: GassmaUndefinedValueError,
    create: () => new GassmaUndefinedValueError("where.name"),
  },
  {
    className: "RelationOnDeleteRestrictError",
    ctor: RelationOnDeleteRestrictError,
    create: () => new RelationOnDeleteRestrictError("posts"),
  },
  {
    className: "GassmaInValidColumnValueError",
    ctor: GassmaInValidColumnValueError,
    create: () => new GassmaInValidColumnValueError(),
  },
  {
    className: "GassmaGroupByHavingDontWriteByError",
    ctor: GassmaGroupByHavingDontWriteByError,
    create: () => new GassmaGroupByHavingDontWriteByError(),
  },
  {
    className: "GassmaAggregateMinError",
    ctor: GassmaAggregateMinError,
    create: () => new GassmaAggregateMinError(),
  },
];

describe("エラークラスの prototype チェーン", () => {
  cases.forEach(({ className, ctor, create }) => {
    describe(className, () => {
      it("toThrow(コンストラクタ) でキャッチできる", () => {
        expect(() => {
          throw create();
        }).toThrow(ctor);
      });

      it("instanceof が成立する", () => {
        expect(create() instanceof ctor).toBe(true);
      });

      it("インスタンスの prototype がコンストラクタの prototype と一致する", () => {
        expect(Object.getPrototypeOf(create())).toBe(ctor.prototype);
      });
    });
  });

  it("GassmaAggregateMinError は親クラス GassmaAggregateMaxError としても instanceof が成立する", () => {
    const err = new GassmaAggregateMinError();

    expect(err instanceof GassmaAggregateMaxError).toBe(true);
  });
});
