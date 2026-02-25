import { validateIncludeOptions } from "../../../../util/relation/validation/validateIncludeOptions";
import type { IncludeData } from "../../../../types/relationTypes";

describe("validateIncludeOptions", () => {
  describe("include値の型チェック", () => {
    it("include値が true の場合エラーを投げない", () => {
      expect(() => validateIncludeOptions({ posts: true })).not.toThrow();
    });

    it("include値がオブジェクトの場合エラーを投げない", () => {
      expect(() =>
        validateIncludeOptions({ posts: { take: 5 } }),
      ).not.toThrow();
    });

    it("include値が true でもオブジェクトでもない場合エラーを投げる", () => {
      expect(() =>
        validateIncludeOptions({ posts: "invalid" as unknown as true }),
      ).toThrow('option "value" must be true or an object');
    });

    it("include値が false の場合エラーを投げる", () => {
      expect(() =>
        validateIncludeOptions({ posts: false as unknown as true }),
      ).toThrow('option "value" must be true or an object');
    });

    it("include値が number の場合エラーを投げる", () => {
      expect(() =>
        validateIncludeOptions({ posts: 123 as unknown as true }),
      ).toThrow('option "value" must be true or an object');
    });
  });

  describe("select と omit の排他チェック", () => {
    it("select と omit を同時に指定した場合エラーを投げる", () => {
      expect(() =>
        validateIncludeOptions({
          posts: { select: { id: true }, omit: { title: true } },
        }),
      ).toThrow("cannot use both select and omit");
    });

    it("select のみの場合エラーを投げない", () => {
      expect(() =>
        validateIncludeOptions({
          posts: { select: { id: true } },
        }),
      ).not.toThrow();
    });

    it("omit のみの場合エラーを投げない", () => {
      expect(() =>
        validateIncludeOptions({
          posts: { omit: { title: true } },
        }),
      ).not.toThrow();
    });
  });

  describe("take の型チェック", () => {
    it("take が number の場合エラーを投げない", () => {
      expect(() =>
        validateIncludeOptions({ posts: { take: 5 } }),
      ).not.toThrow();
    });

    it("take が number 以外の場合エラーを投げる", () => {
      expect(() =>
        validateIncludeOptions({
          posts: { take: "5" as unknown as number },
        }),
      ).toThrow('option "take" must be a number');
    });
  });

  describe("where の型チェック", () => {
    it("where が object の場合エラーを投げない", () => {
      expect(() =>
        validateIncludeOptions({ posts: { where: { id: 1 } } }),
      ).not.toThrow();
    });

    it("where が object 以外の場合エラーを投げる", () => {
      expect(() =>
        validateIncludeOptions({
          posts: { where: "invalid" as unknown as Record<string, unknown> },
        }),
      ).toThrow('option "where" must be an object');
    });
  });

  describe("orderBy の型チェック", () => {
    it("orderBy が object の場合エラーを投げない", () => {
      expect(() =>
        validateIncludeOptions({
          posts: { orderBy: { createdAt: "desc" } },
        }),
      ).not.toThrow();
    });

    it("orderBy が object 以外の場合エラーを投げる", () => {
      const include = {
        posts: { orderBy: "invalid" },
      } as unknown as IncludeData;
      expect(() => validateIncludeOptions(include)).toThrow(
        'option "orderBy" must be an object',
      );
    });
  });

  describe("select の型チェック", () => {
    it("select が object の場合エラーを投げない", () => {
      expect(() =>
        validateIncludeOptions({ posts: { select: { id: true } } }),
      ).not.toThrow();
    });

    it("select が object 以外の場合エラーを投げる", () => {
      expect(() =>
        validateIncludeOptions({
          posts: {
            select: "invalid" as unknown as Record<string, true>,
          },
        }),
      ).toThrow('option "select" must be an object');
    });
  });

  describe("omit の型チェック", () => {
    it("omit が object の場合エラーを投げない", () => {
      expect(() =>
        validateIncludeOptions({ posts: { omit: { title: true } } }),
      ).not.toThrow();
    });

    it("omit が object 以外の場合エラーを投げる", () => {
      expect(() =>
        validateIncludeOptions({
          posts: {
            omit: "invalid" as unknown as Record<string, true>,
          },
        }),
      ).toThrow('option "omit" must be an object');
    });
  });

  describe("複数リレーションのバリデーション", () => {
    it("複数のinclude項目が全て有効な場合エラーを投げない", () => {
      expect(() =>
        validateIncludeOptions({
          posts: true,
          profile: { where: { active: true }, take: 1 },
        }),
      ).not.toThrow();
    });

    it("複数のinclude項目のうち1つが不正な場合エラーを投げる", () => {
      expect(() =>
        validateIncludeOptions({
          posts: true,
          profile: { take: "invalid" as unknown as number },
        }),
      ).toThrow('option "take" must be a number');
    });
  });
});
