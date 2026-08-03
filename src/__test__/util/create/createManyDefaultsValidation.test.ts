import { GassmaInvalidValueError } from "../../../errors/argument/argumentError";
import { buildTestClient, sheetOf } from "../extends/extendsTestClient";

const usersWithDefault = (
  defaultValue: any,
): { loose: any; typed: ReturnType<typeof sheetOf> } => {
  const client = buildTestClient({
    defaults: { Users: { age: () => defaultValue } },
  });
  const typed = sheetOf(client, "Users");
  const loose: any = typed;
  return { loose, typed };
};

describe("defaults が返した書けない値もエラーになる", () => {
  test("createMany: defaults の NaN はエラーになり1行も追加されない", () => {
    const { loose, typed } = usersWithDefault(Number.NaN);
    const fn = () => loose.createMany({ data: [{ id: 9, name: "Zed" }] });
    expect(fn).toThrow(GassmaInvalidValueError);
    expect(fn).toThrow(
      "Invalid value for argument `age`. Expected a finite number, but received NaN.",
    );
    expect(typed.count({})).toBe(3);
  });

  test("createManyAndReturn: defaults の NaN はエラーになり追加されない", () => {
    const { loose, typed } = usersWithDefault(Number.NaN);
    expect(() =>
      loose.createManyAndReturn({ data: [{ id: 9, name: "Zed" }] }),
    ).toThrow(GassmaInvalidValueError);
    expect(typed.count({})).toBe(3);
  });

  test("createMany: defaults の Invalid Date はエラーになり追加されない", () => {
    const { loose, typed } = usersWithDefault(new Date("nope"));
    expect(() => loose.createMany({ data: [{ id: 9, name: "Zed" }] })).toThrow(
      "Invalid value for argument `age`. Expected a valid Date, but the provided Date object is invalid.",
    );
    expect(typed.count({})).toBe(3);
  });

  test("createMany: defaults のオブジェクトはエラーになり追加されない", () => {
    const { loose, typed } = usersWithDefault({ nested: 1 });
    expect(() => loose.createMany({ data: [{ id: 9, name: "Zed" }] })).toThrow(
      "Invalid value for argument `age`. Expected a scalar value, but received an object.",
    );
    expect(typed.count({})).toBe(3);
  });

  test("create: defaults の NaN はエラーになり追加されない", () => {
    const { loose, typed } = usersWithDefault(Number.NaN);
    expect(() => loose.create({ data: { id: 9, name: "Zed" } })).toThrow(
      GassmaInvalidValueError,
    );
    expect(typed.count({})).toBe(3);
  });

  test("upsert(作成分岐): defaults の NaN はエラーになり追加されない", () => {
    const { loose, typed } = usersWithDefault(Number.NaN);
    expect(() =>
      loose.upsert({
        where: { id: 999 },
        create: { id: 999, name: "Zed" },
        update: { name: "Zed" },
      }),
    ).toThrow(GassmaInvalidValueError);
    expect(typed.count({})).toBe(3);
  });

  test("createMany: 明示した値が defaults を上書きしていれば通る", () => {
    const { loose, typed } = usersWithDefault(Number.NaN);
    loose.createMany({ data: [{ id: 9, name: "Zed", age: 5 }] });
    expect(typed.count({})).toBe(4);
  });

  test("createMany: 書ける defaults はそのまま入る", () => {
    const { loose, typed } = usersWithDefault(7);
    loose.createMany({ data: [{ id: 9, name: "Zed" }] });
    expect(typed.findFirst({ where: { id: 9 } })).toEqual({
      id: 9,
      name: "Zed",
      age: 7,
    });
  });
});
