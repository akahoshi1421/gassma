import { buildAutoincrementKey } from "../../../util/defaults/autoincrementKey";

describe("buildAutoincrementKey", () => {
  it("ScriptProperties のキーを組み立てる", () => {
    expect(buildAutoincrementKey("sheet1_Users", "id")).toBe(
      "gassma_autoincrement_sheet1_Users_id",
    );
  });

  it("フィールドごとに別のキーになる", () => {
    expect(buildAutoincrementKey("sheet1_Users", "seq")).toBe(
      "gassma_autoincrement_sheet1_Users_seq",
    );
  });
});
