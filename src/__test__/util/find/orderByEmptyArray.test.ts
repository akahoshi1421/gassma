import { orderByFunc } from "../../../util/find/findUtil/orderBy";

describe("orderByFunc の空配列", () => {
  it("空配列の場合、複数件でもエラーにならず並び順を変えない", () => {
    const data = [{ id: 2 }, { id: 1 }, { id: 3 }];

    const result = orderByFunc(data, []);

    expect(result).toEqual([{ id: 2 }, { id: 1 }, { id: 3 }]);
  });

  it("空配列の場合、1件でも並び順を変えない", () => {
    const data = [{ id: 1 }];

    expect(orderByFunc(data, [])).toEqual([{ id: 1 }]);
  });
});
