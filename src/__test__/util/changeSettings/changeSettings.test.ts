import { changeSettingsFunc } from "../../../util/changeSettings/changeSettings";

describe("changeSettingsFunc", () => {
  test("should keep numbers as-is", () => {
    expect(changeSettingsFunc(2, 5)).toEqual({
      startColumnNumber: 2,
      endColumnNumber: 5,
    });
  });

  test("should convert single letter columns", () => {
    expect(changeSettingsFunc("A", "Z")).toEqual({
      startColumnNumber: 1,
      endColumnNumber: 26,
    });
  });

  test("should convert two letter columns beyond AZ", () => {
    expect(changeSettingsFunc("AA", "BA")).toEqual({
      startColumnNumber: 27,
      endColumnNumber: 53,
    });
  });
});
