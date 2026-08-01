import { GassmaMissingArgumentError } from "../../errors/argument/argumentError";
import { NotFoundError } from "../../errors/find/findError";
import {
  buildTestClient,
  clearSpreadsheetApp,
  sheetOf,
} from "./extends/extendsTestClient";

afterEach(() => {
  clearSpreadsheetApp();
});

const usersController = () => sheetOf(buildTestClient(), "Users");

const allUsers = [
  { id: 1, name: "Alice", age: 20 },
  { id: 2, name: "Bob", age: 30 },
  { id: 3, name: "Carol", age: 40 },
];

const expectMissing = (fn: () => unknown, argumentName: string) => {
  expect(fn).toThrow(GassmaMissingArgumentError);
  expect(fn).toThrow(`Argument \`${argumentName}\` is missing.`);
};

describe("引数なし呼び出し: {} と同じ扱いで正常動作する5操作", () => {
  test("findMany() は全件を返す", () => {
    const users = usersController();
    expect(users.findMany()).toEqual(allUsers);
  });

  test("findFirst() は先頭行を返す", () => {
    const users = usersController();
    expect(users.findFirst()).toEqual(allUsers[0]);
  });

  test("findFirstOrThrow() は先頭行を返す", () => {
    const users = usersController();
    expect(users.findFirstOrThrow()).toEqual(allUsers[0]);
  });

  test("findFirstOrThrow() は空シートなら NotFoundError", () => {
    const users = usersController();
    users.deleteMany();
    expect(() => users.findFirstOrThrow()).toThrow(NotFoundError);
  });

  test("count() は全件数を返す", () => {
    const users = usersController();
    expect(users.count()).toBe(3);
  });

  test("deleteMany() は全件削除する", () => {
    const users = usersController();
    expect(users.deleteMany()).toEqual({ count: 3 });
    expect(users.count()).toBe(0);
  });

  test("undefined を明示的に渡しても {} と同じ扱いになる", () => {
    const users = usersController();
    expect(users.findMany(undefined)).toEqual(allUsers);
    expect(users.findFirst(undefined)).toEqual(allUsers[0]);
    expect(users.count(undefined)).toBe(3);
  });
});

describe("引数なし呼び出し: 必須引数は GassmaMissingArgumentError で報告する", () => {
  test("groupBy() は by を報告する", () => {
    const users = usersController();
    expectMissing(
      // @ts-expect-error 引数必須のまま
      () => users.groupBy(),
      "by",
    );
  });

  test("updateMany() は data を報告し、行を更新しない", () => {
    const users = usersController();
    expectMissing(
      // @ts-expect-error 引数必須のまま
      () => users.updateMany(),
      "data",
    );
    expect(users.findMany()).toEqual(allUsers);
  });

  test("updateManyAndReturn() は data を報告する", () => {
    const users = usersController();
    expectMissing(
      // @ts-expect-error 引数必須のまま
      () => users.updateManyAndReturn(),
      "data",
    );
  });

  test("createMany() は data を報告し、行を作らない", () => {
    const users = usersController();
    expectMissing(
      // @ts-expect-error 引数必須のまま
      () => users.createMany(),
      "data",
    );
    expect(users.count()).toBe(3);
  });

  test("createManyAndReturn() は data を報告する", () => {
    const users = usersController();
    expectMissing(
      // @ts-expect-error 引数必須のまま
      () => users.createManyAndReturn(),
      "data",
    );
  });

  test("create() は data を報告し、行を作らない", () => {
    const users = usersController();
    expectMissing(
      // @ts-expect-error 引数必須のまま
      () => users.create(),
      "data",
    );
    expect(users.count()).toBe(3);
  });

  test("update() は where を報告する", () => {
    const users = usersController();
    expectMissing(
      // @ts-expect-error 引数必須のまま
      () => users.update(),
      "where",
    );
  });

  test("upsert() は where を報告する", () => {
    const users = usersController();
    expectMissing(
      // @ts-expect-error 引数必須のまま
      () => users.upsert(),
      "where",
    );
  });

  test("delete() は where を報告し、行を削除しない", () => {
    const users = usersController();
    expectMissing(
      // @ts-expect-error 引数必須のまま
      () => users.delete(),
      "where",
    );
    expect(users.count()).toBe(3);
  });
});

describe("引数なし呼び出し: aggregate は {} と同じ扱い", () => {
  test("aggregate() は {} を返す", () => {
    const users = usersController();
    // @ts-expect-error 引数必須のまま
    expect(users.aggregate()).toEqual({});
  });
});
