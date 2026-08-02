import { GassmaUnknownArgumentError } from "../../../errors/argument/argumentError";
import { isFilterConditionsMatch } from "../../../util/filterConditions/filterConditions";

describe("未知のフィルタ演算子", () => {
  test("gth (gt の typo) は GassmaUnknownArgumentError", () => {
    expect(() => isFilterConditionsMatch(30, { gth: 30 } as never)).toThrow(
      GassmaUnknownArgumentError,
    );
    expect(() => isFilterConditionsMatch(30, { gth: 30 } as never)).toThrow(
      "Unknown argument `gth`. Did you mean `gt`?",
    );
  });

  test("メッセージに利用可能な演算子一覧が含まれる", () => {
    expect(() => isFilterConditionsMatch(30, { gth: 30 } as never)).toThrow(
      "Available: equals, not, in, notIn, lt, lte, gt, gte, contains, startsWith, endsWith, mode",
    );
  });

  test("正しい演算子と未知の演算子が同居してもエラー", () => {
    expect(() =>
      isFilterConditionsMatch(30, { gt: 10, lth: 40 } as never),
    ).toThrow(GassmaUnknownArgumentError);
  });

  test("空オブジェクトは従来どおり全てにマッチする(挙動維持)", () => {
    expect(isFilterConditionsMatch(30, {})).toBe(true);
    expect(isFilterConditionsMatch(null, {})).toBe(true);
  });

  test("有効な12演算子はエラーにならない", () => {
    expect(
      isFilterConditionsMatch("hello", {
        equals: "hello",
        not: "x",
        in: ["hello"],
        notIn: ["x"],
        lt: "z",
        lte: "z",
        gt: "a",
        gte: "a",
        contains: "ell",
        startsWith: "he",
        endsWith: "lo",
        mode: "default",
      }),
    ).toBe(true);
  });
});
