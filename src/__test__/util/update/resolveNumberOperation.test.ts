import { resolveNumberOperation } from "../../../util/update/resolveNumberOperation";

describe("resolveNumberOperation", () => {
  it("increment で値が加算される", () => {
    expect(resolveNumberOperation(1, { increment: 5 })).toBe(6);
  });

  it("decrement で値が減算される", () => {
    expect(resolveNumberOperation(6, { decrement: 3 })).toBe(3);
  });

  it("multiply で値が乗算される", () => {
    expect(resolveNumberOperation(3, { multiply: 2 })).toBe(6);
  });

  it("divide で値が除算される", () => {
    expect(resolveNumberOperation(6, { divide: 4 })).toBe(1.5);
  });

  it("現在値が number でない場合は 0 をベースにする", () => {
    expect(resolveNumberOperation("hello", { increment: 5 })).toBe(5);
  });

  it("現在値が null/undefined の場合は 0 をベースにする", () => {
    expect(resolveNumberOperation(null, { increment: 10 })).toBe(10);
    expect(resolveNumberOperation(undefined, { decrement: 3 })).toBe(-3);
  });
});
