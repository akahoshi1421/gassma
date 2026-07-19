import {
  GassmaAggregateAvgError,
  GassmaAggregateAvgTypeError,
  GassmaAggregateMaxError,
  GassmaAggregateMinError,
  GassmaAggregateSumError,
  GassmaAggregateSumTypeError,
  GassmaAggregateTypeError,
} from "../../errors/aggregate/aggregateError";
import { GassmaInValidColumnValueError } from "../../errors/changeSettings/changeSettingsError";
import {
  GassmaFindFirstTakeError,
  GassmaFindSelectOmitConflictError,
  NotFoundError,
} from "../../errors/find/findError";
import { GassmaGroupByHavingDontWriteByError } from "../../errors/groupBy/groupByError";
import { NestedWriteTargetNotFoundError } from "../../errors/relation/nestedWriteError";
import {
  GassmaIncludeSelectConflictError,
  GassmaRelationDuplicateError,
  GassmaRelationNotFoundError,
  GassmaThroughRequiredError,
  RelationOnDeleteRestrictError,
} from "../../errors/relation/relationError";
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
    className: "GassmaFindSelectOmitConflictError",
    ctor: GassmaFindSelectOmitConflictError,
    create: () => new GassmaFindSelectOmitConflictError(),
  },
  {
    className: "GassmaIncludeSelectConflictError",
    ctor: GassmaIncludeSelectConflictError,
    create: () => new GassmaIncludeSelectConflictError(),
  },
  {
    className: "GassmaRelationNotFoundError",
    ctor: GassmaRelationNotFoundError,
    create: () => new GassmaRelationNotFoundError("posts", "Users"),
  },
  {
    className: "GassmaThroughRequiredError",
    ctor: GassmaThroughRequiredError,
    create: () => new GassmaThroughRequiredError("tags"),
  },
  {
    className: "GassmaRelationDuplicateError",
    ctor: GassmaRelationDuplicateError,
    create: () =>
      new GassmaRelationDuplicateError("Users", "email", "a@example.com"),
  },
  {
    className: "GassmaAggregateMaxError",
    ctor: GassmaAggregateMaxError,
    create: () => new GassmaAggregateMaxError(),
  },
  {
    className: "GassmaAggregateMinError",
    ctor: GassmaAggregateMinError,
    create: () => new GassmaAggregateMinError(),
  },
  {
    className: "GassmaAggregateSumError",
    ctor: GassmaAggregateSumError,
    create: () => new GassmaAggregateSumError(),
  },
  {
    className: "GassmaAggregateAvgError",
    ctor: GassmaAggregateAvgError,
    create: () => new GassmaAggregateAvgError(),
  },
  {
    className: "GassmaAggregateTypeError",
    ctor: GassmaAggregateTypeError,
    create: () => new GassmaAggregateTypeError(),
  },
  {
    className: "GassmaAggregateSumTypeError",
    ctor: GassmaAggregateSumTypeError,
    create: () => new GassmaAggregateSumTypeError(),
  },
  {
    className: "GassmaAggregateAvgTypeError",
    ctor: GassmaAggregateAvgTypeError,
    create: () => new GassmaAggregateAvgTypeError(),
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

  it("GassmaAggregateSumError / GassmaAggregateAvgError も GassmaAggregateMaxError の instanceof が成立する", () => {
    const sum = new GassmaAggregateSumError();
    const avg = new GassmaAggregateAvgError();

    expect(sum instanceof GassmaAggregateMaxError).toBe(true);
    expect(avg instanceof GassmaAggregateMaxError).toBe(true);
  });

  it("GassmaAggregateAvgTypeError は親クラス GassmaAggregateSumTypeError としても instanceof が成立する", () => {
    const err = new GassmaAggregateAvgTypeError();

    expect(err instanceof GassmaAggregateSumTypeError).toBe(true);
  });
});

describe("追加エラークラスのメッセージ", () => {
  const messageCases: {
    className: string;
    create: () => Error;
    message: string;
  }[] = [
    {
      className: "GassmaFindSelectOmitConflictError",
      create: () => new GassmaFindSelectOmitConflictError(),
      message: "Cannot use both select and omit in the same query",
    },
    {
      className: "GassmaIncludeSelectConflictError",
      create: () => new GassmaIncludeSelectConflictError(),
      message: "Cannot use both include and select in the same query",
    },
    {
      className: "GassmaAggregateMaxError",
      create: () => new GassmaAggregateMaxError(),
      message: "Cannot produce a maximum value of more than one type.",
    },
    {
      className: "GassmaAggregateMinError(親のメッセージを継承)",
      create: () => new GassmaAggregateMinError(),
      message: "Cannot produce a maximum value of more than one type.",
    },
    {
      className: "GassmaAggregateTypeError",
      create: () => new GassmaAggregateTypeError(),
      message:
        'Only "number", "string", "boolean", and "Date" types are supported.',
    },
    {
      className: "GassmaAggregateAvgTypeError(親のメッセージを継承)",
      create: () => new GassmaAggregateAvgTypeError(),
      message: 'Only "number" type is supported.',
    },
    {
      className: "GassmaRelationNotFoundError",
      create: () => new GassmaRelationNotFoundError("posts", "Users"),
      message: 'Relation "posts" is not defined for sheet "Users"',
    },
    {
      className: "GassmaThroughRequiredError",
      create: () => new GassmaThroughRequiredError("tags"),
      message: 'Relation "tags" is manyToMany but "through" is not defined',
    },
    {
      className: "GassmaRelationDuplicateError",
      create: () =>
        new GassmaRelationDuplicateError("Users", "email", "a@example.com"),
      message:
        'Duplicate value "a@example.com" found in "Users.email" for a unique relation',
    },
  ];

  messageCases.forEach(({ className, create, message }) => {
    it(`${className} のメッセージがピン留めされている`, () => {
      expect(create().message).toBe(message);
    });
  });
});
