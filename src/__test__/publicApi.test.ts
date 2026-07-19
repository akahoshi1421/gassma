import { NotFoundError } from "../errors/find/findError";
import { GassmaClient } from "../gassma";
import { GassmaController } from "../gassmaController";
import * as publicApi from "../publicApi";
import { FieldRef } from "../util/filterConditions/fieldRef";
import { skip } from "../util/skip/skip";
import {
  buildTestClient,
  clearSpreadsheetApp,
  sheetOf,
} from "./util/extends/extendsTestClient";

afterEach(() => {
  clearSpreadsheetApp();
});

describe("publicApi", () => {
  test("skip は本体の Symbol と同一", () => {
    expect(typeof publicApi.skip).toBe("symbol");
    expect(publicApi.skip).toBe(skip);
  });

  test("クラス実体は本体のクラスと同一", () => {
    expect(publicApi.GassmaClient).toBe(GassmaClient);
    expect(publicApi.GassmaController).toBe(GassmaController);
    expect(publicApi.FieldRef).toBe(FieldRef);
    expect(publicApi.NotFoundError).toBe(NotFoundError);
  });

  test("全 export が実体を持つ(skip 以外は function)", () => {
    const entries = Object.entries(publicApi);
    expect(entries.length).toBeGreaterThan(0);
    entries.forEach(([name, value]) => {
      if (name === "skip") return;
      expect(typeof value).toBe("function");
    });
  });

  test("ライブラリ内部から投げられたエラーは公開クラスの instanceof を満たす", () => {
    const client = buildTestClient();
    const users = sheetOf(client, "Users");
    expect(() => users.findFirstOrThrow({ where: { id: 999 } })).toThrow(
      publicApi.NotFoundError,
    );
  });
});
