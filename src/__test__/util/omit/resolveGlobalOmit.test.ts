import { resolveGlobalOmit } from "../../../util/omit/resolveGlobalOmit";

describe("resolveGlobalOmit", () => {
  describe("グローバルomitなし", () => {
    test("クエリomitもなければnullを返す", () => {
      expect(resolveGlobalOmit(null, null, null)).toBeNull();
    });

    test("クエリomitだけあればそのまま返す", () => {
      expect(resolveGlobalOmit(null, null, { age: true })).toEqual({
        age: true,
      });
    });
  });

  describe("selectが指定された場合", () => {
    test("グローバルomitがあってもnullを返す", () => {
      expect(
        resolveGlobalOmit({ password: true }, { id: true, name: true }, null),
      ).toBeNull();
    });

    test("クエリomitもあってもnullを返す", () => {
      expect(
        resolveGlobalOmit({ password: true }, { id: true }, { age: true }),
      ).toBeNull();
    });
  });

  describe("グローバルomitのみ", () => {
    test("クエリomitがなければグローバルomitをそのまま返す", () => {
      expect(resolveGlobalOmit({ password: true }, null, null)).toEqual({
        password: true,
      });
    });
  });

  describe("マージ動作", () => {
    test("クエリomit: false でグローバルomitを上書き", () => {
      const result = resolveGlobalOmit({ password: true }, null, {
        password: false,
      });
      expect(result).toBeNull();
    });

    test("クエリomit: true で追加除外", () => {
      const result = resolveGlobalOmit({ password: true }, null, { age: true });
      expect(result).toEqual({ password: true, age: true });
    });

    test("上書きと追加の組み合わせ", () => {
      const result = resolveGlobalOmit({ password: true, secret: true }, null, {
        password: false,
        age: true,
      });
      expect(result).toEqual({ secret: true, age: true });
    });

    test("全てfalseで上書きされたらnullを返す", () => {
      const result = resolveGlobalOmit({ password: true }, null, {
        password: false,
      });
      expect(result).toBeNull();
    });
  });

  describe("クエリomitのfalseフィルタリング", () => {
    test("グローバルomitなしでクエリにfalseが含まれる場合は無視", () => {
      const result = resolveGlobalOmit(null, null, { age: false });
      expect(result).toBeNull();
    });

    test("グローバルomitなしでクエリにtrueとfalseが混在", () => {
      const result = resolveGlobalOmit(null, null, { age: true, name: false });
      expect(result).toEqual({ age: true });
    });
  });
});
