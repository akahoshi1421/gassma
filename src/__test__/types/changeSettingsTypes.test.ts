import type { GassmaController } from "../../gassmaController";
import type { Gassma } from "../../index";

type DtsParams = Parameters<Gassma.GassmaController["changeSettings"]>;
type ImplParams = Parameters<GassmaController["changeSettings"]>;

describe("changeSettings signature types", () => {
  test("should accept column letters (string) in index.d.ts", () => {
    const params: DtsParams = [2, "BA", "BC"];

    expect(params).toBeDefined();
  });

  test("should accept column numbers in index.d.ts", () => {
    const params: DtsParams = [2, 1, 3];

    expect(params).toBeDefined();
  });

  test("should match the implementation signature", () => {
    const dtsParams: DtsParams = [2, "A", 5];
    const implParams: ImplParams = dtsParams;

    expect(implParams).toBeDefined();
  });

  test("should reject boolean columns and string startRowNumber", () => {
    // @ts-expect-error 列指定に boolean は指定できない
    const boolColumn: DtsParams = [2, true, 3];

    // @ts-expect-error startRowNumber は number のみ
    const stringRow: DtsParams = ["2", 1, 3];

    expect(boolColumn).toBeDefined();
    expect(stringRow).toBeDefined();
  });
});
