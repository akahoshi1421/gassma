import {
  CASCADE_TEMP_PREFIX,
  createTempValueFactory,
} from "../../../../util/relation/onUpdate/cascadeTempValue";

describe("createTempValueFactory", () => {
  it("呼び出すたびに異なる値を返す", () => {
    const next = createTempValueFactory(() => false);

    const values = [next(), next(), next()];

    expect(new Set(values).size).toBe(3);
    values.forEach((value) => {
      expect(value.startsWith(CASCADE_TEMP_PREFIX)).toBe(true);
    });
  });

  it("使用中の候補はスキップして別の値を返す", () => {
    const next = createTempValueFactory(
      (candidate) => candidate === `${CASCADE_TEMP_PREFIX}0`,
    );

    expect(next()).toBe(`${CASCADE_TEMP_PREFIX}0_`);
    expect(next()).toBe(`${CASCADE_TEMP_PREFIX}1`);
  });

  it("プローブが常に使用中と答えても停止する", () => {
    const isTaken = jest.fn(() => true);
    const next = createTempValueFactory(isTaken);

    expect(next()).toBe(`${CASCADE_TEMP_PREFIX}0${"_".repeat(32)}`);
    expect(isTaken).toHaveBeenCalledTimes(32);
  });
});
