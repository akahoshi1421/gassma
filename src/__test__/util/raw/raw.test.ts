import * as publicApi from "../../../publicApi";
import {
  escapeFormulaInjection,
  escapeFormulaInjectionRow,
} from "../../../util/core/escapeFormulaInjection";
import { isDict } from "../../../util/other/isDict";
import {
  RawValue,
  isRawValue,
  raw,
  rawBrand,
  unwrapRawValue,
} from "../../../util/raw/raw";
import { normalizeQueryInput } from "../../../util/skip/normalizeQueryInput";
import { isUpdateNestedWriteOperation } from "../../../util/update/nestedWrite/extractRelationDataForUpdate";
import { isNumberOperation } from "../../../util/update/resolveNumberOperation";
import { createCrossRealmValue } from "../../consts/crossRealm";

describe("raw ラッパの生成と判定", () => {
  it("raw は isRawValue が真になる値を生成する", () => {
    expect(isRawValue(raw("=SUM(A1:A10)"))).toBe(true);
  });

  it("unwrapRawValue は元の文字列をそのまま返す", () => {
    const value = "=SUM(A1:A10)";
    expect(unwrapRawValue(raw(value))).toBe(value);
  });

  it("raw 以外の値は isRawValue が偽", () => {
    expect(isRawValue("=SUM(A1:A10)")).toBe(false);
    expect(isRawValue(null)).toBe(false);
    expect(isRawValue(undefined)).toBe(false);
    expect(isRawValue(42)).toBe(false);
    expect(isRawValue(true)).toBe(false);
    expect(isRawValue(new Date("2025-01-01"))).toBe(false);
    expect(isRawValue({})).toBe(false);
    expect(isRawValue({ value: "=SUM(A1:A10)" })).toBe(false);
    expect(isRawValue([])).toBe(false);
  });

  it("d.ts のブランドキー名を真似た平オブジェクトは RawValue 扱いしない", () => {
    expect(isRawValue({ __gassmaRawValueBrand: "Gassma.raw" })).toBe(false);
  });

  it("publicApi.raw は本体の関数と同一", () => {
    expect(publicApi.raw).toBe(raw);
  });
});

describe("escapeFormulaInjection との連携", () => {
  it("raw された = 始まり文字列はエスケープされない", () => {
    expect(escapeFormulaInjection(raw("=SUM(A1:A10)"))).toBe("=SUM(A1:A10)");
  });

  it("raw された + - @ 始まり文字列もエスケープされない", () => {
    expect(escapeFormulaInjection(raw("+1+1"))).toBe("+1+1");
    expect(escapeFormulaInjection(raw("-1+1"))).toBe("-1+1");
    expect(escapeFormulaInjection(raw("@SUM"))).toBe("@SUM");
  });

  it("raw された通常の文字列はそのまま返る", () => {
    expect(escapeFormulaInjection(raw("hello"))).toBe("hello");
  });

  it("escapeFormulaInjectionRow はセル単位で raw だけ素通しする", () => {
    expect(
      escapeFormulaInjectionRow([raw("=1+1"), "=1+1", "normal", 42, null]),
    ).toEqual(["=1+1", "'=1+1", "normal", 42, null]);
  });

  it("配列の再帰サニタイズ中でも raw は素通しされる", () => {
    expect(escapeFormulaInjection([raw("=A1"), "=B1"])).toEqual([
      "=A1",
      "'=B1",
    ]);
  });
});

describe("realm 安全性", () => {
  it("別 realm で構築されたブランド付きオブジェクトも RawValue と判定する", () => {
    const makeForeignRawValue = createCrossRealmValue<
      (brand: symbol, value: string) => unknown
    >(
      "(brand, value) => { class RawValue { constructor(v) { this[brand] = v; } } return new RawValue(value); }",
    );
    const foreign = makeForeignRawValue(rawBrand, "=SUM(A1:A2)");

    expect(isRawValue(foreign)).toBe(true);
    expect(escapeFormulaInjection(foreign)).toBe("=SUM(A1:A2)");
    expect(isDict(foreign)).toBe(false);
  });

  it("raw 値は別 realm の関数を往復しても判定できる", () => {
    const identity = createCrossRealmValue<(v: unknown) => unknown>("(v) => v");
    const roundTripped = identity(raw("=NOW()"));

    expect(isRawValue(roundTripped)).toBe(true);
    expect(escapeFormulaInjection(roundTripped)).toBe("=NOW()");
  });

  it("別 realm の平オブジェクトは RawValue 扱いしない", () => {
    expect(isRawValue(createCrossRealmValue("({})"))).toBe(false);
  });
});

describe("他の値判定と衝突しない", () => {
  it("isDict は RawValue を辞書扱いしない", () => {
    expect(isDict(raw("=SUM(A1)"))).toBe(false);
  });

  it("isNumberOperation は RawValue を数値演算扱いしない", () => {
    expect(isNumberOperation(raw("=SUM(A1)"))).toBe(false);
  });

  it("isUpdateNestedWriteOperation は RawValue を nested write 扱いしない", () => {
    expect(isUpdateNestedWriteOperation(raw("=SUM(A1)"))).toBe(false);
  });

  it("normalizeQueryInput(strict) は RawValue を同一参照のまま素通しする", () => {
    const wrapped = raw("=SUM(A1)");
    const normalized = normalizeQueryInput({ data: { total: wrapped } }, true);

    expect(normalized.data.total).toBe(wrapped);
  });
});

describe("非文字列の扱い", () => {
  it("型上は string 専用だがランタイムの非文字列は素通しする", () => {
    // @ts-expect-error raw は string 専用
    const wrapped = raw(42);

    expect(escapeFormulaInjection(wrapped)).toBe(42);
  });

  it("内部コンストラクタ経由の非文字列も素通しする", () => {
    expect(escapeFormulaInjection(new RawValue(42))).toBe(42);
  });
});
