import { mapGroupByInput } from "../../../util/map/mapGroupBy";
import type { FieldMapping } from "../../../util/map/mapFields";

describe("mapGroupByInput", () => {
  const mapping: FieldMapping = {
    totalAmount: "total_amount",
    firstName: "first_name",
  };

  it("should map by string to sheet name", () => {
    const result = mapGroupByInput({ by: "totalAmount" }, mapping);
    expect(result.by).toBe("total_amount");
  });

  it("should map by array to sheet names", () => {
    const result = mapGroupByInput(
      { by: ["totalAmount", "firstName", "status"] },
      mapping,
    );
    expect(result.by).toEqual(["total_amount", "first_name", "status"]);
  });

  it("should map _sum keys to sheet names", () => {
    const result = mapGroupByInput(
      { by: "status", _sum: { totalAmount: true } },
      mapping,
    );
    expect(result._sum).toEqual({ total_amount: true });
  });

  it("should map _count keys to sheet names", () => {
    const result = mapGroupByInput(
      { by: "status", _count: { totalAmount: true, firstName: true } },
      mapping,
    );
    expect(result._count).toEqual({ total_amount: true, first_name: true });
  });

  it("should map _avg, _min, _max keys to sheet names", () => {
    const result = mapGroupByInput(
      {
        by: "status",
        _avg: { totalAmount: true },
        _min: { firstName: true },
        _max: { totalAmount: true },
      },
      mapping,
    );
    expect(result._avg).toEqual({ total_amount: true });
    expect(result._min).toEqual({ first_name: true });
    expect(result._max).toEqual({ total_amount: true });
  });

  it("should not modify unmapped keys", () => {
    const result = mapGroupByInput(
      { by: "status", _sum: { quantity: true } },
      mapping,
    );
    expect(result.by).toBe("status");
    expect(result._sum).toEqual({ quantity: true });
  });

  it("should preserve other properties like where", () => {
    const result = mapGroupByInput({ by: "status", where: { id: 1 } }, mapping);
    expect(result.where).toEqual({ id: 1 });
  });

  it("should map having keys to sheet names", () => {
    const result = mapGroupByInput(
      {
        by: "status",
        having: { totalAmount: { _sum: { gte: 100000 } } },
      },
      mapping,
    );
    expect(result.having).toEqual({ total_amount: { _sum: { gte: 100000 } } });
  });

  it("should not modify unmapped having keys", () => {
    const result = mapGroupByInput(
      {
        by: "status",
        having: { quantity: { _count: { gte: 5 } } },
      },
      mapping,
    );
    expect(result.having).toEqual({ quantity: { _count: { gte: 5 } } });
  });
});
