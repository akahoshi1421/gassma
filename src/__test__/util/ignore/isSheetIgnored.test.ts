import { isSheetIgnored } from "../../../util/ignore/isSheetIgnored";

describe("isSheetIgnored", () => {
  it("ignoredSheets に含まれるシート名は true を返す", () => {
    expect(isSheetIgnored("Logs", ["Logs", "Temp"])).toBe(true);
  });

  it("ignoredSheets に含まれないシート名は false を返す", () => {
    expect(isSheetIgnored("Users", ["Logs", "Temp"])).toBe(false);
  });

  it("空の ignoredSheets なら常に false を返す", () => {
    expect(isSheetIgnored("Users", [])).toBe(false);
  });
});
