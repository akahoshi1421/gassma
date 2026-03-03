import { isNumberOperation } from "../../../util/update/resolveNumberOperation";

describe("isNumberOperation", () => {
  it("{ increment: 5 } は true を返す", () => {
    expect(isNumberOperation({ increment: 5 })).toBe(true);
  });

  it("{ decrement: 3 } は true を返す", () => {
    expect(isNumberOperation({ decrement: 3 })).toBe(true);
  });

  it("{ multiply: 2 } は true を返す", () => {
    expect(isNumberOperation({ multiply: 2 })).toBe(true);
  });

  it("{ divide: 4 } は true を返す", () => {
    expect(isNumberOperation({ divide: 4 })).toBe(true);
  });

  it("{ name: 'test' } は false を返す", () => {
    expect(isNumberOperation({ name: "test" })).toBe(false);
  });

  it("null は false を返す", () => {
    expect(isNumberOperation(null)).toBe(false);
  });

  it("42 は false を返す", () => {
    expect(isNumberOperation(42)).toBe(false);
  });

  it("{ create: {} } は false を返す（nested write と区別）", () => {
    expect(isNumberOperation({ create: {} })).toBe(false);
  });
});
