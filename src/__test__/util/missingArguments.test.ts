import { GassmaMissingArgumentError } from "../../errors/argument/argumentError";
import { GassmaClient } from "../../gassma";
import { skip } from "../../util/skip/skip";
import {
  buildTestClient,
  clearSpreadsheetApp,
  sheetOf,
} from "./extends/extendsTestClient";

afterEach(() => {
  clearSpreadsheetApp();
});

const looseUsers = (): { loose: any; typed: ReturnType<typeof sheetOf> } => {
  const typed = sheetOf(buildTestClient(), "Users");
  const loose: any = typed;
  return { loose, typed };
};

const expectMissing = (fn: () => unknown, argumentName: string) => {
  expect(fn).toThrow(GassmaMissingArgumentError);
  expect(fn).toThrow(`Argument \`${argumentName}\` is missing.`);
};

describe("delete: where 必須", () => {
  test("where 省略は GassmaMissingArgumentError で、行を削除しない", () => {
    const { loose, typed } = looseUsers();
    expect(typed.count({})).toBe(3);
    expectMissing(() => loose.delete({}), "where");
    expect(typed.count({})).toBe(3);
    expect(typed.findFirst({ where: { id: 1 } })).toEqual({
      id: 1,
      name: "Alice",
      age: 20,
    });
  });

  test("where: undefined も GassmaMissingArgumentError で行を削除しない", () => {
    const { loose, typed } = looseUsers();
    expectMissing(() => loose.delete({ where: undefined }), "where");
    expect(typed.count({})).toBe(3);
  });

  test("where: {} は従来どおり先頭行を削除する（対象外・挙動維持）", () => {
    const { loose, typed } = looseUsers();
    const deleted = loose.delete({ where: {} });
    expect(deleted).toEqual({ id: 1, name: "Alice", age: 20 });
    expect(typed.count({})).toBe(2);
  });
});

describe("upsert: where / create / update 必須", () => {
  test("全省略は where から報告する", () => {
    const { loose } = looseUsers();
    expectMissing(() => loose.upsert({}), "where");
  });

  test("where のみは create を報告する", () => {
    const { loose } = looseUsers();
    expectMissing(() => loose.upsert({ where: { id: 1 } }), "create");
  });

  test("where + create は update を報告する", () => {
    const { loose } = looseUsers();
    expectMissing(
      () => loose.upsert({ where: { id: 999 }, create: { id: 999 } }),
      "update",
    );
  });
});

describe("create: data 必須", () => {
  test("data 省略は GassmaMissingArgumentError で行を作らない", () => {
    const { loose, typed } = looseUsers();
    expectMissing(() => loose.create({}), "data");
    expect(typed.count({})).toBe(3);
  });

  test("data: undefined も GassmaMissingArgumentError", () => {
    const { loose } = looseUsers();
    expectMissing(() => loose.create({ data: undefined }), "data");
  });

  test("data: {} は従来どおり作成する（対象外・挙動維持）", () => {
    const { loose, typed } = looseUsers();
    const created = loose.create({ data: {} });
    expect(created).toEqual({ id: null, name: null, age: null });
    expect(typed.count({})).toBe(4);
  });
});

describe("createMany / createManyAndReturn: data 必須", () => {
  test("createMany の data 省略は GassmaMissingArgumentError", () => {
    const { loose } = looseUsers();
    expectMissing(() => loose.createMany({}), "data");
  });

  test("createManyAndReturn の data 省略は GassmaMissingArgumentError", () => {
    const { loose } = looseUsers();
    expectMissing(() => loose.createManyAndReturn({}), "data");
  });
});

describe("update: where / data 必須", () => {
  test("where 省略は where を報告する", () => {
    const { loose } = looseUsers();
    expectMissing(() => loose.update({ data: { age: 99 } }), "where");
  });

  test("where: undefined も where を報告する", () => {
    const { loose } = looseUsers();
    expectMissing(
      () => loose.update({ where: undefined, data: { age: 99 } }),
      "where",
    );
  });

  test("where あり data 省略は data を報告する", () => {
    const { loose } = looseUsers();
    expectMissing(() => loose.update({ where: { id: 1 } }), "data");
  });

  test("where: {} + data ありは従来どおり先頭行を更新する（対象外・挙動維持）", () => {
    const { loose } = looseUsers();
    const result = loose.update({ where: {}, data: { age: 99 } });
    expect(result).toEqual({ id: 1, name: "Alice", age: 99 });
  });
});

describe("updateMany / updateManyAndReturn: data 必須", () => {
  test("updateMany の data 省略は data を報告する", () => {
    const { loose } = looseUsers();
    expectMissing(() => loose.updateMany({ where: { id: 1 } }), "data");
  });

  test("updateMany の全省略も data を報告する", () => {
    const { loose } = looseUsers();
    expectMissing(() => loose.updateMany({}), "data");
  });

  test("updateManyAndReturn の data 省略は data を報告する", () => {
    const { loose } = looseUsers();
    expectMissing(
      () => loose.updateManyAndReturn({ where: { id: 1 } }),
      "data",
    );
  });
});

describe("groupBy: by 必須", () => {
  test("by 省略は GassmaMissingArgumentError（[{}] を返さない）", () => {
    const { loose } = looseUsers();
    expectMissing(() => loose.groupBy({}), "by");
  });

  test("by: undefined も GassmaMissingArgumentError", () => {
    const { loose } = looseUsers();
    expectMissing(() => loose.groupBy({ by: undefined }), "by");
  });

  test("by: [] は従来どおり（対象外・挙動維持）", () => {
    const { loose } = looseUsers();
    expect(loose.groupBy({ by: [] })).toEqual([{}, {}, {}]);
  });

  test("by: ['age'] は従来どおり集約する", () => {
    const { loose } = looseUsers();
    expect(loose.groupBy({ by: ["age"] })).toEqual([
      { age: 20 },
      { age: 30 },
      { age: 40 },
    ]);
  });
});

describe("strict モード + Gassma.skip でも捕捉する", () => {
  test("delete({ where: skip }) は skip 除去後 undefined 扱いで where を報告", () => {
    buildTestClient();
    const strict: any = sheetOf(
      new GassmaClient({ strictUndefinedChecks: true }),
      "Users",
    );
    expectMissing(() => strict.delete({ where: skip }), "where");
  });

  test("create({ data: skip }) は skip 除去後 undefined 扱いで data を報告", () => {
    buildTestClient();
    const strict: any = sheetOf(
      new GassmaClient({ strictUndefinedChecks: true }),
      "Users",
    );
    expectMissing(() => strict.create({ data: skip }), "data");
  });
});
