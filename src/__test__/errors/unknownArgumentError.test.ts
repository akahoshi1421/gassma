import { GassmaUnknownArgumentError } from "../../errors/argument/argumentError";

describe("GassmaUnknownArgumentError", () => {
  test("近い候補があればサジェスト付きのメッセージになる", () => {
    const error = new GassmaUnknownArgumentError("whre", ["where", "limit"]);
    expect(error.message).toBe(
      "Unknown argument `whre`. Did you mean `where`?\n\nAvailable: where, limit",
    );
    expect(error.name).toBe("GassmaUnknownArgumentError");
  });

  test("日本語の列名でもサジェストが働く", () => {
    const error = new GassmaUnknownArgumentError("名まえ", [
      "名前",
      "年齢",
      "住所",
      "郵便番号",
      "職業",
    ]);
    expect(error.message).toBe(
      "Unknown argument `名まえ`. Did you mean `名前`?\n\nAvailable: 名前, 年齢, 住所, 郵便番号, 職業",
    );
  });

  test("近い候補が無ければサジェスト行は出さず Available のみ", () => {
    const error = new GassmaUnknownArgumentError("foobarbaz", [
      "where",
      "limit",
    ]);
    expect(error.message).toBe(
      "Unknown argument `foobarbaz`.\n\nAvailable: where, limit",
    );
  });

  test("候補が空なら Available 行を出さない", () => {
    const error = new GassmaUnknownArgumentError("whre", []);
    expect(error.message).toBe("Unknown argument `whre`.");
  });

  test("候補が配列でなくても構築に失敗しない(型なし利用者コード対策)", () => {
    const LooseCtor: any = GassmaUnknownArgumentError;
    const error = new LooseCtor("arg1", "arg2");
    expect(error.message).toBe("Unknown argument `arg1`.");
  });

  test("Error を継承している", () => {
    const error = new GassmaUnknownArgumentError("whre", ["where"]);
    expect(Object.prototype.toString.call(error)).toBe("[object Error]");
  });
});
