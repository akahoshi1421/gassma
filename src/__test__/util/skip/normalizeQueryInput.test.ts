import { FieldRef } from "../../../util/filterConditions/fieldRef";
import { normalizeQueryInput } from "../../../util/skip/normalizeQueryInput";
import { skip } from "../../../util/skip/skip";
import { createCrossRealmValue } from "../../consts/crossRealm";

const catchError = (fn: () => unknown): Error => {
  try {
    fn();
  } catch (e) {
    if (e instanceof Error) return e;
  }
  throw new Error("expected an Error to be thrown");
};

describe("normalizeQueryInput", () => {
  describe("skip の除去（strict 無効・有効共通）", () => {
    test("dict 直下の skip キーを除去する", () => {
      expect(
        normalizeQueryInput({ where: { name: skip, age: 20 } }, false),
      ).toEqual({ where: { age: 20 } });
      expect(
        normalizeQueryInput({ where: { name: skip, age: 20 } }, true),
      ).toEqual({ where: { age: 20 } });
    });

    test("深いネストの skip キーも除去する", () => {
      const input = {
        where: { age: { gte: skip, lte: 30 } },
        data: { posts: { create: { title: skip, body: "b" } } },
      };
      expect(normalizeQueryInput(input, false)).toEqual({
        where: { age: { lte: 30 } },
        data: { posts: { create: { body: "b" } } },
      });
    });

    test("トップレベル引数のキー（where 自体など）が skip なら除去する", () => {
      expect(normalizeQueryInput({ where: skip, take: 1 }, true)).toEqual({
        take: 1,
      });
    });

    test("配列内の dict の skip キーも除去する", () => {
      expect(
        normalizeQueryInput(
          { where: { OR: [{ name: skip, age: 1 }, { age: 2 }] } },
          false,
        ),
      ).toEqual({ where: { OR: [{ age: 1 }, { age: 2 }] } });
    });

    test("別 realm の Symbol.for も skip として除去する", () => {
      const crossRealmSkip = createCrossRealmValue<symbol>(
        'Symbol.for("Gassma.skip")',
      );
      expect(
        normalizeQueryInput({ where: { name: crossRealmSkip } }, false),
      ).toEqual({ where: {} });
    });

    test("配列要素の skip は GassmaSkipInArrayError を投げる", () => {
      expect(
        catchError(() =>
          normalizeQueryInput({ where: { age: { in: [1, skip] } } }, false),
        ).name,
      ).toBe("GassmaSkipInArrayError");
      expect(() =>
        normalizeQueryInput({ where: { age: { in: [1, skip] } } }, true),
      ).toThrow(
        "Invalid value for argument `where.age.in[1]`: Can not use `Gassma.skip` value within array. Use `null` or filter out `Gassma.skip` values.",
      );
    });
  });

  describe("strict 無効時の undefined（従来挙動の維持）", () => {
    test("undefined 値のキーはそのまま残す", () => {
      const result = normalizeQueryInput(
        { where: { name: undefined, age: 20 } },
        false,
      );
      expect(result).toEqual({ where: { name: undefined, age: 20 } });
      expect(Object.keys(result.where)).toContain("name");
    });

    test("配列内の undefined もそのまま残す", () => {
      expect(
        normalizeQueryInput({ where: { age: { in: [1, undefined] } } }, false),
      ).toEqual({ where: { age: { in: [1, undefined] } } });
    });
  });

  describe("strict 有効時の undefined", () => {
    test("dict 値の undefined は GassmaUndefinedValueError を投げる", () => {
      expect(
        catchError(() =>
          normalizeQueryInput({ where: { name: undefined } }, true),
        ).name,
      ).toBe("GassmaUndefinedValueError");
      expect(() =>
        normalizeQueryInput({ where: { name: undefined } }, true),
      ).toThrow(
        "Invalid value for argument `where.name`: explicitly `undefined` values are not allowed.",
      );
    });

    test("深いネストや配列内の undefined も投げる", () => {
      expect(() =>
        normalizeQueryInput(
          { data: { posts: { create: { title: undefined } } } },
          true,
        ),
      ).toThrow("Invalid value for argument `data.posts.create.title`");
      expect(() =>
        normalizeQueryInput({ where: { age: { in: [1, undefined] } } }, true),
      ).toThrow("Invalid value for argument `where.age.in[1]`");
    });

    test("トップレベルのキー値が undefined でも投げる", () => {
      expect(() => normalizeQueryInput({ where: undefined }, true)).toThrow(
        "Invalid value for argument `where`",
      );
    });
  });

  describe("値の保全", () => {
    test("入力を破壊しない", () => {
      const input = { where: { name: skip, age: 20 } };
      normalizeQueryInput(input, false);
      expect(input.where.name).toBe(skip);
    });

    test("Date と FieldRef は参照ごと保持し再帰しない", () => {
      const date = new Date("2024-01-01T00:00:00Z");
      const ref = new FieldRef("Users", "age");
      const result = normalizeQueryInput(
        { where: { createdAt: date, age: { gt: ref } } },
        true,
      );
      expect(result.where.createdAt).toBe(date);
      expect(result.where.age.gt).toBe(ref);
    });

    test("入力全体が undefined ならそのまま返す（引数省略と区別不能のため）", () => {
      expect(normalizeQueryInput(undefined, true)).toBeUndefined();
    });
  });
});
