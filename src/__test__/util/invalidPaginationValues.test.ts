import { GassmaInvalidValueError } from "../../errors/argument/argumentError";
import {
  GassmaFindFirstTakeError,
  GassmaSkipNegativeError,
} from "../../errors/find/findError";
import { IncludeInvalidOptionTypeError } from "../../errors/relation/relationValidationError";
import { buildTestClient, sheetOf } from "./extends/extendsTestClient";
import { clearGasGlobals } from "./transaction/transactionTestClient";

afterEach(() => {
  clearGasGlobals();
});

const looseUsers = (options?: { relations?: boolean }): any => {
  const typed = sheetOf(buildTestClient(options), "Users");
  const loose: any = typed;
  return loose;
};

describe("findMany の take の非有限数はエラー", () => {
  test("take: NaN はエラー", () => {
    const loose = looseUsers();
    const fn = () => loose.findMany({ take: NaN });
    expect(fn).toThrow(GassmaInvalidValueError);
    expect(fn).toThrow(
      "Invalid value for argument `take`. Expected a finite number, but received NaN.",
    );
  });

  test("take: Infinity はエラー", () => {
    const loose = looseUsers();
    expect(() => loose.findMany({ take: Infinity })).toThrow(
      "Invalid value for argument `take`. Expected a finite number, but received Infinity.",
    );
  });

  test("take: -Infinity はエラー", () => {
    const loose = looseUsers();
    expect(() => loose.findMany({ take: -Infinity })).toThrow(
      "Invalid value for argument `take`. Expected a finite number, but received -Infinity.",
    );
  });
});

describe("findMany の skip の非有限数はエラー", () => {
  test("skip: NaN はエラー", () => {
    const loose = looseUsers();
    const fn = () => loose.findMany({ skip: NaN });
    expect(fn).toThrow(GassmaInvalidValueError);
    expect(fn).toThrow(
      "Invalid value for argument `skip`. Expected a finite number, but received NaN.",
    );
  });

  test("skip: Infinity はエラー", () => {
    const loose = looseUsers();
    expect(() => loose.findMany({ skip: Infinity })).toThrow(
      "Invalid value for argument `skip`. Expected a finite number, but received Infinity.",
    );
  });

  test("skip: -Infinity はエラー", () => {
    const loose = looseUsers();
    expect(() => loose.findMany({ skip: -Infinity })).toThrow(
      "Invalid value for argument `skip`. Expected a finite number, but received -Infinity.",
    );
  });
});

describe("findFirst のページング非有限数", () => {
  test("skip: NaN はエラー", () => {
    const loose = looseUsers();
    expect(() => loose.findFirst({ skip: NaN })).toThrow(
      GassmaInvalidValueError,
    );
  });

  test("take: NaN は既存の GassmaFindFirstTakeError のまま", () => {
    const loose = looseUsers();
    expect(() => loose.findFirst({ take: NaN })).toThrow(
      GassmaFindFirstTakeError,
    );
  });

  test("take: Infinity は既存の GassmaFindFirstTakeError のまま", () => {
    const loose = looseUsers();
    expect(() => loose.findFirst({ take: Infinity })).toThrow(
      GassmaFindFirstTakeError,
    );
  });
});

describe("count の take/skip の非有限数はエラー", () => {
  test("take: NaN はエラー", () => {
    const loose = looseUsers();
    expect(() => loose.count({ take: NaN })).toThrow(GassmaInvalidValueError);
  });

  test("skip: Infinity はエラー", () => {
    const loose = looseUsers();
    expect(() => loose.count({ skip: Infinity })).toThrow(
      GassmaInvalidValueError,
    );
  });
});

describe("aggregate の take/skip の非有限数はエラー", () => {
  test("skip: NaN はエラー(黙って無視しない)", () => {
    const loose = looseUsers();
    expect(() => loose.aggregate({ _max: { age: true }, skip: NaN })).toThrow(
      "Invalid value for argument `skip`. Expected a finite number, but received NaN.",
    );
  });

  test("take: Infinity はエラー", () => {
    const loose = looseUsers();
    expect(() =>
      loose.aggregate({ _max: { age: true }, take: Infinity }),
    ).toThrow(GassmaInvalidValueError);
  });
});

describe("groupBy の take/skip の非有限数はエラー", () => {
  test("skip: NaN はエラー(黙って無視しない)", () => {
    const loose = looseUsers();
    expect(() =>
      loose.groupBy({ by: ["age"], _min: { age: true }, skip: NaN }),
    ).toThrow(
      "Invalid value for argument `skip`. Expected a finite number, but received NaN.",
    );
  });

  test("take: NaN はエラー", () => {
    const loose = looseUsers();
    expect(() =>
      loose.groupBy({ by: ["age"], _min: { age: true }, take: NaN }),
    ).toThrow(GassmaInvalidValueError);
  });
});

describe("updateMany の limit の非有限数はエラー", () => {
  test("limit: NaN はエラー", () => {
    const loose = looseUsers();
    const fn = () =>
      loose.updateMany({ where: {}, data: { name: "x" }, limit: NaN });
    expect(fn).toThrow(GassmaInvalidValueError);
    expect(fn).toThrow(
      "Invalid value for argument `limit`. Expected a finite number, but received NaN.",
    );
  });

  test("limit: Infinity はエラー", () => {
    const loose = looseUsers();
    expect(() =>
      loose.updateMany({ where: {}, data: { name: "x" }, limit: Infinity }),
    ).toThrow(
      "Invalid value for argument `limit`. Expected a finite number, but received Infinity.",
    );
  });

  test("limit: -Infinity はエラー", () => {
    const loose = looseUsers();
    expect(() =>
      loose.updateMany({ where: {}, data: { name: "x" }, limit: -Infinity }),
    ).toThrow(
      "Invalid value for argument `limit`. Expected a finite number, but received -Infinity.",
    );
  });
});

describe("deleteMany の limit の非有限数はエラー", () => {
  test("limit: NaN はエラー(黙って0件削除にしない)", () => {
    const loose = looseUsers();
    expect(() => loose.deleteMany({ where: {}, limit: NaN })).toThrow(
      "Invalid value for argument `limit`. Expected a finite number, but received NaN.",
    );
  });

  test("limit: Infinity はエラー", () => {
    const loose = looseUsers();
    expect(() => loose.deleteMany({ where: {}, limit: Infinity })).toThrow(
      GassmaInvalidValueError,
    );
  });
});

describe("include の take/skip の非有限数はエラー", () => {
  test("take: NaN はエラー", () => {
    const loose = looseUsers({ relations: true });
    const fn = () => loose.findMany({ include: { posts: { take: NaN } } });
    expect(fn).toThrow(IncludeInvalidOptionTypeError);
    expect(fn).toThrow(
      'Include "posts": option "take" must be a finite number',
    );
  });

  test("take: -Infinity はエラー", () => {
    const loose = looseUsers({ relations: true });
    expect(() =>
      loose.findMany({ include: { posts: { take: -Infinity } } }),
    ).toThrow('Include "posts": option "take" must be a finite number');
  });

  test("skip: Infinity はエラー", () => {
    const loose = looseUsers({ relations: true });
    expect(() =>
      loose.findMany({ include: { posts: { skip: Infinity } } }),
    ).toThrow('Include "posts": option "skip" must be a finite number');
  });

  test("ネストした include の take: NaN もエラー", () => {
    const loose = looseUsers({ relations: true });
    expect(() =>
      loose.findMany({
        include: { posts: { include: { comments: { take: NaN } } } },
      }),
    ).toThrow('Include "comments": option "take" must be a finite number');
  });
});

describe("現状維持の固定(仕様変更しない)", () => {
  test("findMany の take: undefined は無視して全件", () => {
    const loose = looseUsers();
    expect(loose.findMany({ take: undefined })).toHaveLength(3);
  });

  test("findMany の take: 2.5 は2件相当", () => {
    const loose = looseUsers();
    expect(loose.findMany({ take: 2.5 })).toHaveLength(2);
  });

  test("findMany の skip: 1.5 は1件スキップ相当", () => {
    const loose = looseUsers();
    expect(loose.findMany({ skip: 1.5 })).toHaveLength(2);
  });

  test("findMany の skip: -1 は GassmaSkipNegativeError", () => {
    const loose = looseUsers();
    expect(() => loose.findMany({ skip: -1 })).toThrow(GassmaSkipNegativeError);
  });

  test("findMany の take: -2 は末尾から2件", () => {
    const loose = looseUsers();
    const result = loose.findMany({ take: -2 });
    expect(result.map((row: any) => row.name)).toEqual(["Bob", "Carol"]);
  });

  test("deleteMany の limit: 2.5 は2件削除", () => {
    const loose = looseUsers();
    expect(loose.deleteMany({ where: {}, limit: 2.5 })).toEqual({ count: 2 });
  });
});
