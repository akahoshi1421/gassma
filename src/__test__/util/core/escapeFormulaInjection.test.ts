import { escapeFormulaInjection } from "../../../util/core/escapeFormulaInjection";

describe("escapeFormulaInjection", () => {
  describe("数式プレフィックスをエスケープする", () => {
    it("= で始まる文字列の先頭に ' を付与する", () => {
      expect(escapeFormulaInjection("=1+1")).toBe("'=1+1");
    });

    it("+ で始まる文字列の先頭に ' を付与する", () => {
      expect(escapeFormulaInjection("+1+1")).toBe("'+1+1");
    });

    it("- で始まる文字列の先頭に ' を付与する", () => {
      expect(escapeFormulaInjection("-1+1")).toBe("'-1+1");
    });

    it("@ で始まる文字列の先頭に ' を付与する", () => {
      expect(escapeFormulaInjection("@SUM")).toBe("'@SUM");
    });
  });

  describe("エスケープ不要な値はそのまま返す", () => {
    it("通常の文字列はそのまま返す", () => {
      expect(escapeFormulaInjection("hello")).toBe("hello");
    });

    it("数値はそのまま返す", () => {
      expect(escapeFormulaInjection(42)).toBe(42);
    });

    it("nullはそのまま返す", () => {
      expect(escapeFormulaInjection(null)).toBe(null);
    });

    it("undefinedはそのまま返す", () => {
      expect(escapeFormulaInjection(undefined)).toBe(undefined);
    });

    it("booleanはそのまま返す", () => {
      expect(escapeFormulaInjection(true)).toBe(true);
    });

    it("空文字列はそのまま返す", () => {
      expect(escapeFormulaInjection("")).toBe("");
    });

    it("Dateはそのまま返す", () => {
      const date = new Date("2025-01-01");
      expect(escapeFormulaInjection(date)).toBe(date);
    });
  });

  describe("複雑な数式パターン", () => {
    it("=IMPORTRANGE をエスケープする", () => {
      expect(escapeFormulaInjection('=IMPORTRANGE("url", "A1")')).toBe(
        '\'=IMPORTRANGE("url", "A1")',
      );
    });

    it("=IMAGE をエスケープする", () => {
      expect(escapeFormulaInjection('=IMAGE("https://evil.com")')).toBe(
        '\'=IMAGE("https://evil.com")',
      );
    });

    it("=SUM をエスケープする", () => {
      expect(escapeFormulaInjection("=SUM(A1:A10)")).toBe("'=SUM(A1:A10)");
    });
  });
});

describe("escapeFormulaInjectionRow", () => {
  const {
    escapeFormulaInjectionRow,
  } = require("../../../util/core/escapeFormulaInjection");

  it("配列内の全要素をエスケープする", () => {
    const row = ["=1+1", "normal", 42, "+cmd", null];
    expect(escapeFormulaInjectionRow(row)).toEqual([
      "'=1+1",
      "normal",
      42,
      "'+cmd",
      null,
    ]);
  });

  it("空配列はそのまま返す", () => {
    expect(escapeFormulaInjectionRow([])).toEqual([]);
  });
});
