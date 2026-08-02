import { GassmaUnknownArgumentError } from "../../../errors/argument/argumentError";
import { validateConfigColumns } from "../../../util/config/validateConfigColumns";

const headersBySheet: Record<string, string[]> = {
  Users: ["id", "名前", "年齢", "住所"],
  Posts: ["id", "authorId", "title", "updatedAt"],
};

const sheets: Record<string, unknown> = { Users: {}, Posts: {} };

const makeGetColumnHeaders = () =>
  jest.fn((sheetName: string) => headersBySheet[sheetName] ?? []);

describe("validateConfigColumns", () => {
  describe("defaults", () => {
    it("存在しない列名のキーがあるとエラーを投げる", () => {
      expect(() =>
        validateConfigColumns(
          { defaults: { Users: { 年齢: 0, 住処: "" } } },
          sheets,
          makeGetColumnHeaders(),
        ),
      ).toThrow(GassmaUnknownArgumentError);
    });

    it("エラーメッセージにサジェストが含まれる", () => {
      expect(() =>
        validateConfigColumns(
          { defaults: { Users: { 住処: "" } } },
          sheets,
          makeGetColumnHeaders(),
        ),
      ).toThrow("Unknown argument `住処`. Did you mean `住所`?");
    });

    it("すべて実在する列名なら通る", () => {
      expect(() =>
        validateConfigColumns(
          { defaults: { Users: { 年齢: 0, 住所: "" } } },
          sheets,
          makeGetColumnHeaders(),
        ),
      ).not.toThrow();
    });
  });

  describe("updatedAt / autoincrement / ignore(値が列名)", () => {
    it("updatedAt の文字列指定の typo でエラーを投げる", () => {
      expect(() =>
        validateConfigColumns(
          { updatedAt: { Posts: "updatedat" } },
          sheets,
          makeGetColumnHeaders(),
        ),
      ).toThrow(GassmaUnknownArgumentError);
    });

    it("updatedAt の配列指定の中の typo でエラーを投げる", () => {
      expect(() =>
        validateConfigColumns(
          { updatedAt: { Posts: ["updatedAt", "updatedat"] } },
          sheets,
          makeGetColumnHeaders(),
        ),
      ).toThrow(GassmaUnknownArgumentError);
    });

    it("autoincrement の typo でエラーを投げる", () => {
      expect(() =>
        validateConfigColumns(
          { autoincrement: { Posts: "iid" } },
          sheets,
          makeGetColumnHeaders(),
        ),
      ).toThrow(GassmaUnknownArgumentError);
    });

    it("ignore の typo でエラーを投げる", () => {
      expect(() =>
        validateConfigColumns(
          { ignore: { Posts: ["titel"] } },
          sheets,
          makeGetColumnHeaders(),
        ),
      ).toThrow(GassmaUnknownArgumentError);
    });

    it("実在する列名なら通る", () => {
      expect(() =>
        validateConfigColumns(
          {
            updatedAt: { Posts: "updatedAt" },
            autoincrement: { Posts: "id" },
            ignore: { Posts: ["title"] },
          },
          sheets,
          makeGetColumnHeaders(),
        ),
      ).not.toThrow();
    });
  });

  describe("omit(キーが列名)", () => {
    it("存在しない列名のキーがあるとエラーを投げる", () => {
      expect(() =>
        validateConfigColumns(
          { omit: { Users: { 名前まえ: true } } },
          sheets,
          makeGetColumnHeaders(),
        ),
      ).toThrow(GassmaUnknownArgumentError);
    });

    it("実在する列名なら通る", () => {
      expect(() =>
        validateConfigColumns(
          { omit: { Users: { 名前: true } } },
          sheets,
          makeGetColumnHeaders(),
        ),
      ).not.toThrow();
    });
  });

  describe("map(値がシート実列名)", () => {
    const mappedHeaders: Record<string, string[]> = {
      Users: ["id", "name", "年齢", "address"],
    };
    const getMappedHeaders = jest.fn(
      (sheetName: string) => mappedHeaders[sheetName] ?? [],
    );

    it("マッピングが正しければ通る(見出しはコード名に変換済み)", () => {
      expect(() =>
        validateConfigColumns(
          { map: { Users: { name: "名前", address: "住所" } } },
          sheets,
          getMappedHeaders,
        ),
      ).not.toThrow();
    });

    it("値の typo でエラーを投げ、生の見出しからサジェストする", () => {
      expect(() =>
        validateConfigColumns(
          { map: { Users: { address: "住処" } } },
          sheets,
          makeGetColumnHeaders(),
        ),
      ).toThrow("Unknown argument `住処`. Did you mean `住所`?");
    });

    it("map 使用時、他の設定はコード名で照合される", () => {
      expect(() =>
        validateConfigColumns(
          {
            map: { Users: { name: "名前", address: "住所" } },
            defaults: { Users: { address: "" } },
          },
          sheets,
          getMappedHeaders,
        ),
      ).not.toThrow();
    });

    it("map 使用時、マッピング前のシート実列名で他の設定を書くとエラーを投げる", () => {
      expect(() =>
        validateConfigColumns(
          {
            map: { Users: { name: "名前", address: "住所" } },
            defaults: { Users: { 住所: "" } },
          },
          sheets,
          getMappedHeaders,
        ),
      ).toThrow(GassmaUnknownArgumentError);
    });
  });

  describe("見出し読みの範囲", () => {
    it("設定に登場しないシートの見出しは読まない", () => {
      const getColumnHeaders = makeGetColumnHeaders();
      validateConfigColumns(
        { defaults: { Users: { 年齢: 0 } } },
        sheets,
        getColumnHeaders,
      );
      expect(getColumnHeaders).toHaveBeenCalledTimes(1);
      expect(getColumnHeaders).toHaveBeenCalledWith("Users");
    });

    it("同じシートに複数の設定があっても見出し読みは1回", () => {
      const getColumnHeaders = makeGetColumnHeaders();
      validateConfigColumns(
        {
          defaults: { Users: { 年齢: 0 } },
          updatedAt: { Users: "住所" },
          omit: { Users: { 名前: true } },
        },
        sheets,
        getColumnHeaders,
      );
      expect(getColumnHeaders).toHaveBeenCalledTimes(1);
    });

    it("存在しないシート名のキーは黙って無視する(見出しも読まない)", () => {
      const getColumnHeaders = makeGetColumnHeaders();
      expect(() =>
        validateConfigColumns(
          { defaults: { Userz: { 何か: 1 } } },
          sheets,
          getColumnHeaders,
        ),
      ).not.toThrow();
      expect(getColumnHeaders).not.toHaveBeenCalled();
    });

    it("設定が何もなければ何も読まない", () => {
      const getColumnHeaders = makeGetColumnHeaders();
      expect(() =>
        validateConfigColumns({}, sheets, getColumnHeaders),
      ).not.toThrow();
      expect(getColumnHeaders).not.toHaveBeenCalled();
    });
  });
});
