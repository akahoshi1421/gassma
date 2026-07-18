import { isSkipValue, skip } from "../../../util/skip/skip";
import { createCrossRealmValue } from "../../consts/crossRealm";

describe("skip", () => {
  test("skip はグローバルシンボルレジストリのシンボルである", () => {
    expect(typeof skip).toBe("symbol");
    expect(skip).toBe(Symbol.for("Gassma.skip"));
  });

  test("isSkipValue は skip のみ true を返す", () => {
    expect(isSkipValue(skip)).toBe(true);
    expect(isSkipValue(undefined)).toBe(false);
    expect(isSkipValue(null)).toBe(false);
    expect(isSkipValue("skip")).toBe(false);
    expect(isSkipValue(Symbol("Gassma.skip"))).toBe(false);
    expect(isSkipValue({})).toBe(false);
  });

  test("別 realm で作られた Symbol.for も skip と一致する", () => {
    const crossRealmSkip = createCrossRealmValue<symbol>(
      'Symbol.for("Gassma.skip")',
    );
    expect(isSkipValue(crossRealmSkip)).toBe(true);
  });
});
