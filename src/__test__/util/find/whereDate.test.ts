import type { GassmaControllerUtil } from "../../../types/gassmaControllerUtilType";
import type { FilterConditions } from "../../../types/coreTypes";
import {
  createCrossRealmDate,
  createCrossRealmValue,
} from "../../consts/crossRealm";
import { findManyFunc } from "../../../util/find/findMany";

const aliceDate = "2026-07-18T09:30:00.000Z";
const bobDate = "2026-07-19T12:00:00.000Z";
const charlieDate = "2026-07-20T15:45:00.000Z";

const getDateMockControllerUtil = (): GassmaControllerUtil => ({
  sheet: {
    getDataRange: () =>
      ({
        getValues: () => [
          ["名前", "作成日"],
          ["Alice", new Date(aliceDate)],
          ["Bob", new Date(bobDate)],
          ["Charlie", new Date(charlieDate)],
        ],
      }) as any,
    getLastRow: () => 4,
    getLastColumn: () => 2,
    getRange: (
      row: number,
      _col: number,
      numRows: number,
      _numCols: number,
    ) => {
      if (row === 1 && numRows === 1) {
        return {
          getValues: () => [["名前", "作成日"]],
        } as any;
      }
      return {
        getValues: () => [
          ["Alice", new Date(aliceDate)],
          ["Bob", new Date(bobDate)],
          ["Charlie", new Date(charlieDate)],
        ],
      } as any;
    },
  } as any,
  startRowNumber: 1,
  startColumnNumber: 1,
  endColumnNumber: 2,
});

describe("findManyFunc with Date where", () => {
  test("should match direct value with same time but different instance", () => {
    const result = findManyFunc(getDateMockControllerUtil(), {
      where: { 作成日: new Date(aliceDate) },
    });

    expect(result).toEqual([{ 名前: "Alice", 作成日: new Date(aliceDate) }]);
  });

  test("should not match direct value with different time", () => {
    const result = findManyFunc(getDateMockControllerUtil(), {
      where: { 作成日: new Date("2026-07-18T09:30:00.001Z") },
    });

    expect(result).toEqual([]);
  });

  test("should not match ISO string direct value against Date cells", () => {
    const result = findManyFunc(getDateMockControllerUtil(), {
      where: { 作成日: aliceDate },
    });

    expect(result).toEqual([]);
  });

  test("should match equals with same time but different instance", () => {
    const result = findManyFunc(getDateMockControllerUtil(), {
      where: { 作成日: { equals: new Date(aliceDate) } },
    });

    expect(result).toEqual([{ 名前: "Alice", 作成日: new Date(aliceDate) }]);
  });

  test("should exclude same time with not", () => {
    const result = findManyFunc(getDateMockControllerUtil(), {
      where: { 作成日: { not: new Date(aliceDate) } },
    });

    expect(result).toEqual([
      { 名前: "Bob", 作成日: new Date(bobDate) },
      { 名前: "Charlie", 作成日: new Date(charlieDate) },
    ]);
  });

  test("should match in with same times but different instances", () => {
    const result = findManyFunc(getDateMockControllerUtil(), {
      where: { 作成日: { in: [new Date(aliceDate), new Date(bobDate)] } },
    });

    expect(result).toEqual([
      { 名前: "Alice", 作成日: new Date(aliceDate) },
      { 名前: "Bob", 作成日: new Date(bobDate) },
    ]);
  });

  test("should exclude same times with notIn", () => {
    const result = findManyFunc(getDateMockControllerUtil(), {
      where: { 作成日: { notIn: [new Date(aliceDate), new Date(bobDate)] } },
    });

    expect(result).toEqual([
      { 名前: "Charlie", 作成日: new Date(charlieDate) },
    ]);
  });

  test("should match direct value inside AND", () => {
    const result = findManyFunc(getDateMockControllerUtil(), {
      where: { AND: [{ 作成日: new Date(aliceDate) }] },
    });

    expect(result).toEqual([{ 名前: "Alice", 作成日: new Date(aliceDate) }]);
  });

  test("should match direct values inside OR", () => {
    const result = findManyFunc(getDateMockControllerUtil(), {
      where: {
        OR: [{ 作成日: new Date(aliceDate) }, { 作成日: new Date(bobDate) }],
      },
    });

    expect(result).toEqual([
      { 名前: "Alice", 作成日: new Date(aliceDate) },
      { 名前: "Bob", 作成日: new Date(bobDate) },
    ]);
  });

  test("should exclude direct value inside NOT", () => {
    const result = findManyFunc(getDateMockControllerUtil(), {
      where: { NOT: [{ 作成日: new Date(aliceDate) }] },
    });

    expect(result).toEqual([
      { 名前: "Bob", 作成日: new Date(bobDate) },
      { 名前: "Charlie", 作成日: new Date(charlieDate) },
    ]);
  });
});

describe("findManyFunc with cross-realm Date where (GAS library boundary)", () => {
  test("should match direct value created in another realm", () => {
    const result = findManyFunc(getDateMockControllerUtil(), {
      where: { 作成日: createCrossRealmDate(aliceDate) },
    });

    expect(result).toEqual([{ 名前: "Alice", 作成日: new Date(aliceDate) }]);
  });

  test("should match equals whose filter object and Date are cross-realm", () => {
    const crossFilter = createCrossRealmValue<FilterConditions>(
      `{ equals: new Date(${JSON.stringify(aliceDate)}) }`,
    );
    const result = findManyFunc(getDateMockControllerUtil(), {
      where: { 作成日: crossFilter },
    });

    expect(result).toEqual([{ 名前: "Alice", 作成日: new Date(aliceDate) }]);
  });

  test("should exclude same time with cross-realm not", () => {
    const result = findManyFunc(getDateMockControllerUtil(), {
      where: { 作成日: { not: createCrossRealmDate(aliceDate) } },
    });

    expect(result).toEqual([
      { 名前: "Bob", 作成日: new Date(bobDate) },
      { 名前: "Charlie", 作成日: new Date(charlieDate) },
    ]);
  });

  test("should match in with a fully cross-realm filter", () => {
    const crossFilter = createCrossRealmValue<FilterConditions>(
      `{ in: [new Date(${JSON.stringify(aliceDate)}), new Date(${JSON.stringify(bobDate)})] }`,
    );
    const result = findManyFunc(getDateMockControllerUtil(), {
      where: { 作成日: crossFilter },
    });

    expect(result).toEqual([
      { 名前: "Alice", 作成日: new Date(aliceDate) },
      { 名前: "Bob", 作成日: new Date(bobDate) },
    ]);
  });

  test("should exclude same times with cross-realm notIn", () => {
    const result = findManyFunc(getDateMockControllerUtil(), {
      where: {
        作成日: {
          notIn: [
            createCrossRealmDate(aliceDate),
            createCrossRealmDate(bobDate),
          ],
        },
      },
    });

    expect(result).toEqual([
      { 名前: "Charlie", 作成日: new Date(charlieDate) },
    ]);
  });

  test("should match cross-realm direct value inside OR", () => {
    const result = findManyFunc(getDateMockControllerUtil(), {
      where: {
        OR: [
          { 作成日: createCrossRealmDate(aliceDate) },
          { 作成日: createCrossRealmDate(bobDate) },
        ],
      },
    });

    expect(result).toEqual([
      { 名前: "Alice", 作成日: new Date(aliceDate) },
      { 名前: "Bob", 作成日: new Date(bobDate) },
    ]);
  });
});
