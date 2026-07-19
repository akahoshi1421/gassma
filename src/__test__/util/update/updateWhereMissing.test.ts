import { GassmaUpdateWhereMissingError } from "../../../errors/update/updateError";
import {
  buildTestClient,
  clearSpreadsheetApp,
  sheetOf,
} from "../extends/extendsTestClient";

afterEach(() => {
  clearSpreadsheetApp();
});

describe("update の where 必須バリデーション", () => {
  test("where 未指定は GassmaUpdateWhereMissingError", () => {
    const users = sheetOf(buildTestClient(), "Users");
    const rawUpdate: (updateData: {
      data: Record<string, unknown>;
    }) => unknown = users.update.bind(users);

    expect(() => rawUpdate({ data: { age: 99 } })).toThrow(
      GassmaUpdateWhereMissingError,
    );
    expect(() => rawUpdate({ data: { age: 99 } })).toThrow(
      "Argument `where` is missing.",
    );
  });

  test("where: undefined も GassmaUpdateWhereMissingError", () => {
    const users = sheetOf(buildTestClient(), "Users");

    expect(() => users.update({ where: undefined, data: { age: 99 } })).toThrow(
      GassmaUpdateWhereMissingError,
    );
  });

  test("where: {} は従来どおり先頭行を更新する", () => {
    const users = sheetOf(buildTestClient(), "Users");

    const result = users.update({ where: {}, data: { age: 99 } });

    expect(result).toEqual({ id: 1, name: "Alice", age: 99 });
  });
});
