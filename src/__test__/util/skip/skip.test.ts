import { isSkipValue, skip } from "../../../util/skip/skip";

describe("skip", () => {
  test("skip はライブラリ固有の単一シンボルである", () => {
    expect(typeof skip).toBe("symbol");
    expect(skip.description).toBe("Gassma.skip");
  });

  test("isSkipValue は skip のみ true を返す", () => {
    expect(isSkipValue(skip)).toBe(true);
    expect(isSkipValue(undefined)).toBe(false);
    expect(isSkipValue(null)).toBe(false);
    expect(isSkipValue("skip")).toBe(false);
    expect(isSkipValue(Symbol("Gassma.skip"))).toBe(false);
    expect(isSkipValue({})).toBe(false);
  });
});
