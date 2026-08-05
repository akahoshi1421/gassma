import { GassmaGroupByOrderByRequiredError } from "../../errors/groupBy/groupByError";

describe("GassmaGroupByOrderByRequiredError", () => {
  test("take だけを指定したときのメッセージ", () => {
    const error = new GassmaGroupByOrderByRequiredError("take");

    expect(error.message).toBe(
      "groupBy requires `orderBy` when using `take`. Specify `orderBy` with at least one field, or remove `take`.",
    );
    expect(error.name).toBe("GassmaGroupByOrderByRequiredError");
  });

  test("skip だけを指定したときのメッセージ", () => {
    const error = new GassmaGroupByOrderByRequiredError("skip");

    expect(error.message).toBe(
      "groupBy requires `orderBy` when using `skip`. Specify `orderBy` with at least one field, or remove `skip`.",
    );
  });

  test("take と skip の両方を指定したときのメッセージ", () => {
    const error = new GassmaGroupByOrderByRequiredError("take", "skip");

    expect(error.message).toBe(
      "groupBy requires `orderBy` when using `take` and `skip`. Specify `orderBy` with at least one field, or remove `take` and `skip`.",
    );
  });

  test("Error を継承している", () => {
    const error = new GassmaGroupByOrderByRequiredError("take");

    expect(Object.prototype.toString.call(error)).toBe("[object Error]");
  });

  test("toThrow(コンストラクタ) でキャッチできる", () => {
    expect(() => {
      throw new GassmaGroupByOrderByRequiredError("skip");
    }).toThrow(GassmaGroupByOrderByRequiredError);
  });
});
