import { GassmaInvalidValueError } from "../../errors/argument/argumentError";

describe("GassmaInvalidValueError", () => {
  test("メッセージが Prisma の文体でピン留めされている", () => {
    const error = new GassmaInvalidValueError("orderBy", '"asc" | "desc"');
    expect(error.message).toBe(
      'Invalid value for argument `orderBy`. Expected "asc" | "desc".',
    );
    expect(error.name).toBe("GassmaInvalidValueError");
  });

  test("nulls 用のメッセージも組み立てられる", () => {
    const error = new GassmaInvalidValueError("nulls", '"first" | "last"');
    expect(error.message).toBe(
      'Invalid value for argument `nulls`. Expected "first" | "last".',
    );
  });

  test("Error を継承している", () => {
    const error = new GassmaInvalidValueError("orderBy", '"asc" | "desc"');
    expect(Object.prototype.toString.call(error)).toBe("[object Error]");
  });

  test("toThrow(コンストラクタ) でキャッチできる", () => {
    expect(() => {
      throw new GassmaInvalidValueError("sort", '"asc" | "desc"');
    }).toThrow(GassmaInvalidValueError);
  });
});
