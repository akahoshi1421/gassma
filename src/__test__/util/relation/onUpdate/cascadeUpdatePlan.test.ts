import type { ChangedPair } from "../../../../util/relation/onUpdate/cascadeUpdatePlan";
import { buildCascadeSteps } from "../../../../util/relation/onUpdate/cascadeUpdatePlan";
import {
  createCrossRealmDate,
  createCrossRealmValue,
} from "../../../consts/crossRealm";

const makeTempFactory = () => {
  let counter = 0;
  return jest.fn(() => {
    const value = `tmp${counter}`;
    counter += 1;
    return value;
  });
};

describe("buildCascadeSteps", () => {
  it("独立したペアは1グループずつそのまま並ぶ", () => {
    const factory = makeTempFactory();

    const steps = buildCascadeSteps(
      [
        { oldValue: 1, newValue: 10 },
        { oldValue: 2, newValue: 20 },
      ],
      factory,
    );

    expect(steps).toEqual([
      { oldValues: [1], newValue: 10 },
      { oldValues: [2], newValue: 20 },
    ]);
    expect(factory).not.toHaveBeenCalled();
  });

  it("玉突きするペアは巻き込まれる側を先に実行する順になる", () => {
    const factory = makeTempFactory();

    const steps = buildCascadeSteps(
      [
        { oldValue: 1, newValue: 2 },
        { oldValue: 2, newValue: 3 },
      ],
      factory,
    );

    expect(steps).toEqual([
      { oldValues: [2], newValue: 3 },
      { oldValues: [1], newValue: 2 },
    ]);
    expect(factory).not.toHaveBeenCalled();
  });

  it("同じ新値のペアは1ステップにまとまる", () => {
    const steps = buildCascadeSteps(
      [
        { oldValue: 1, newValue: 9 },
        { oldValue: 2, newValue: 9 },
      ],
      makeTempFactory(),
    );

    expect(steps).toEqual([{ oldValues: [1, 2], newValue: 9 }]);
  });

  it("同じ旧値が複数ペアに現れた場合は最初のペアを採用する", () => {
    const steps = buildCascadeSteps(
      [
        { oldValue: 1, newValue: 5 },
        { oldValue: 1, newValue: 6 },
      ],
      makeTempFactory(),
    );

    expect(steps).toEqual([{ oldValues: [1], newValue: 5 }]);
  });

  it("2値の循環は一時値を1つ使い最後に書き戻す", () => {
    const factory = makeTempFactory();

    const steps = buildCascadeSteps(
      [
        { oldValue: 1, newValue: 2 },
        { oldValue: 2, newValue: 1 },
      ],
      factory,
    );

    expect(steps).toEqual([
      { oldValues: [1], newValue: "tmp0" },
      { oldValues: [2], newValue: 1 },
      { oldValues: ["tmp0"], newValue: 2 },
    ]);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("3値の循環も一時値1つで解決し書き戻しは最後に回る", () => {
    const factory = makeTempFactory();

    const steps = buildCascadeSteps(
      [
        { oldValue: 1, newValue: 2 },
        { oldValue: 2, newValue: 3 },
        { oldValue: 3, newValue: 1 },
      ],
      factory,
    );

    expect(steps).toEqual([
      { oldValues: [1], newValue: "tmp0" },
      { oldValues: [3], newValue: 1 },
      { oldValues: [2], newValue: 3 },
      { oldValues: ["tmp0"], newValue: 2 },
    ]);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("Date の新値は同時刻・別インスタンスでも同じグループにまとまる", () => {
    const target = new Date("2026-03-01T00:00:00.000Z");
    const sameTimeTarget = new Date(target.getTime());

    const steps = buildCascadeSteps(
      [
        { oldValue: 1, newValue: target },
        { oldValue: 2, newValue: sameTimeTarget },
      ],
      makeTempFactory(),
    );

    expect(steps).toEqual([{ oldValues: [1, 2], newValue: target }]);
  });

  it("Date 同士の入れ替えも一時値で解決する", () => {
    const a = new Date("2026-01-01T00:00:00.000Z");
    const b = new Date("2026-02-01T00:00:00.000Z");
    const factory = makeTempFactory();

    const steps = buildCascadeSteps(
      [
        { oldValue: a, newValue: b },
        { oldValue: b, newValue: a },
      ],
      factory,
    );

    expect(steps).toEqual([
      { oldValues: [a], newValue: "tmp0" },
      { oldValues: [b], newValue: a },
      { oldValues: ["tmp0"], newValue: b },
    ]);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("別インスタンスの Invalid Date の旧値は別グループとして残る", () => {
    const invalidA = new Date("invalid");
    const invalidB = new Date("invalid");
    const factory = makeTempFactory();

    const steps = buildCascadeSteps(
      [
        { oldValue: invalidA, newValue: 1 },
        { oldValue: invalidB, newValue: 2 },
      ],
      factory,
    );

    expect(steps).toEqual([
      { oldValues: [invalidA], newValue: 1 },
      { oldValues: [invalidB], newValue: 2 },
    ]);
    expect(factory).not.toHaveBeenCalled();
  });

  it("Invalid Date の新値は同一インスタンスでも併合されない", () => {
    const invalidA = new Date("invalid");
    const invalidB = new Date("invalid");

    const steps = buildCascadeSteps(
      [
        { oldValue: 1, newValue: invalidA },
        { oldValue: 2, newValue: invalidA },
        { oldValue: 3, newValue: invalidB },
      ],
      makeTempFactory(),
    );

    expect(steps).toEqual([
      { oldValues: [1], newValue: invalidA },
      { oldValues: [2], newValue: invalidA },
      { oldValues: [3], newValue: invalidB },
    ]);
  });

  it("後段グループの実行で解けた先頭グループは他の未処理グループより先に実行される", () => {
    const factory = makeTempFactory();

    const steps = buildCascadeSteps(
      [
        { oldValue: 1, newValue: 2 },
        { oldValue: 2, newValue: 3 },
        { oldValue: 9, newValue: 10 },
      ],
      factory,
    );

    expect(steps).toEqual([
      { oldValues: [2], newValue: 3 },
      { oldValues: [1], newValue: 2 },
      { oldValues: [9], newValue: 10 },
    ]);
    expect(factory).not.toHaveBeenCalled();
  });

  it("複数の循環は先頭側から順に一時値で解決し書き戻しはまとめて最後に回る", () => {
    const factory = makeTempFactory();

    const steps = buildCascadeSteps(
      [
        { oldValue: 1, newValue: 2 },
        { oldValue: 2, newValue: 1 },
        { oldValue: 10, newValue: 11 },
        { oldValue: 11, newValue: 12 },
        { oldValue: 12, newValue: 10 },
      ],
      factory,
    );

    expect(steps).toEqual([
      { oldValues: [1], newValue: "tmp0" },
      { oldValues: [2], newValue: 1 },
      { oldValues: [10], newValue: "tmp1" },
      { oldValues: [12], newValue: 10 },
      { oldValues: [11], newValue: 12 },
      { oldValues: ["tmp0"], newValue: 2 },
      { oldValues: ["tmp1"], newValue: 11 },
    ]);
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it("クロスrealmのDateの新値も同時刻の同一realmのDateと同じグループにまとまる", () => {
    const target = new Date("2026-03-01T00:00:00.000Z");
    const crossTarget = createCrossRealmDate("2026-03-01T00:00:00.000Z");

    const steps = buildCascadeSteps(
      [
        { oldValue: 1, newValue: target },
        { oldValue: 2, newValue: crossTarget },
      ],
      makeTempFactory(),
    );

    expect(steps).toEqual([{ oldValues: [1, 2], newValue: target }]);
  });

  it("クロスrealmのDateの旧値は同時刻の同一realmの新値の玉突きとして検出される", () => {
    const crossOld = createCrossRealmDate("2026-01-01T00:00:00.000Z");
    const sameTimeNew = new Date("2026-01-01T00:00:00.000Z");
    const factory = makeTempFactory();

    const steps = buildCascadeSteps(
      [
        { oldValue: 1, newValue: sameTimeNew },
        { oldValue: crossOld, newValue: 2 },
      ],
      factory,
    );

    expect(steps).toEqual([
      { oldValues: [crossOld], newValue: 2 },
      { oldValues: [1], newValue: sameTimeNew },
    ]);
    expect(factory).not.toHaveBeenCalled();
  });

  it("クロスrealmのDateを含む入れ替えも循環として検出され一時値で解決する", () => {
    const crossA = createCrossRealmDate("2026-01-01T00:00:00.000Z");
    const sameTimeA = new Date("2026-01-01T00:00:00.000Z");
    const b = new Date("2026-02-01T00:00:00.000Z");
    const factory = makeTempFactory();

    const steps = buildCascadeSteps(
      [
        { oldValue: crossA, newValue: b },
        { oldValue: b, newValue: sameTimeA },
      ],
      factory,
    );

    expect(steps).toEqual([
      { oldValues: [crossA], newValue: "tmp0" },
      { oldValues: [b], newValue: sameTimeA },
      { oldValues: ["tmp0"], newValue: b },
    ]);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("クロスrealmのInvalid Dateの旧値は同一realmのInvalid Dateと併合されず別グループとして残る", () => {
    const invalidSame = new Date("invalid");
    const invalidCross = createCrossRealmValue<Date>('new Date("nope")');
    const factory = makeTempFactory();

    const steps = buildCascadeSteps(
      [
        { oldValue: invalidSame, newValue: 1 },
        { oldValue: invalidCross, newValue: 2 },
      ],
      factory,
    );

    expect(steps).toEqual([
      { oldValues: [invalidSame], newValue: 1 },
      { oldValues: [invalidCross], newValue: 2 },
    ]);
    expect(factory).not.toHaveBeenCalled();
  });

  it("クロスrealmのInvalid Dateの新値は併合されない", () => {
    const invalidCross = createCrossRealmValue<Date>('new Date("nope")');

    const steps = buildCascadeSteps(
      [
        { oldValue: 1, newValue: invalidCross },
        { oldValue: 2, newValue: invalidCross },
      ],
      makeTempFactory(),
    );

    expect(steps).toEqual([
      { oldValues: [1], newValue: invalidCross },
      { oldValues: [2], newValue: invalidCross },
    ]);
  });

  it("どのステップも oldValues が空にならない", () => {
    const scenarios: ChangedPair[][] = [
      [],
      [{ oldValue: 1, newValue: 2 }],
      [
        { oldValue: 1, newValue: 2 },
        { oldValue: 2, newValue: 1 },
      ],
      [
        { oldValue: 1, newValue: 2 },
        { oldValue: 2, newValue: 3 },
        { oldValue: 3, newValue: 1 },
        { oldValue: 5, newValue: 6 },
        { oldValue: 6, newValue: 5 },
        { oldValue: 7, newValue: 8 },
      ],
    ];

    scenarios.forEach((pairs) => {
      const steps = buildCascadeSteps(pairs, makeTempFactory());
      expect(steps.every((step) => step.oldValues.length > 0)).toBe(true);
    });
  });
});
