import { mapAggregateResult } from "../../../util/map/mapAggregateResult";
import type { FieldMapping } from "../../../util/map/mapFields";

describe("mapAggregateResult", () => {
  const mapping: FieldMapping = {
    totalAmount: "total_amount",
    firstName: "first_name",
  };

  it("should map top-level keys from sheet to code names", () => {
    const result = mapAggregateResult(
      { status: "delivered", total_amount: 100 },
      mapping,
    );
    expect(result).toEqual({ status: "delivered", totalAmount: 100 });
  });

  it("should map keys inside _sum", () => {
    const result = mapAggregateResult(
      { status: "delivered", _sum: { total_amount: 500 } },
      mapping,
    );
    expect(result._sum).toEqual({ totalAmount: 500 });
  });

  it("should map keys inside _count", () => {
    const result = mapAggregateResult(
      { status: "delivered", _count: { total_amount: 10, first_name: 5 } },
      mapping,
    );
    expect(result._count).toEqual({ totalAmount: 10, firstName: 5 });
  });

  it("should map keys inside _avg, _min, _max", () => {
    const result = mapAggregateResult(
      {
        status: "delivered",
        _avg: { total_amount: 50 },
        _min: { total_amount: 10 },
        _max: { first_name: "Z" },
      },
      mapping,
    );
    expect(result._avg).toEqual({ totalAmount: 50 });
    expect(result._min).toEqual({ totalAmount: 10 });
    expect(result._max).toEqual({ firstName: "Z" });
  });

  it("should not modify unmapped keys", () => {
    const result = mapAggregateResult(
      { status: "delivered", _sum: { quantity: 100 } },
      mapping,
    );
    expect(result.status).toBe("delivered");
    expect(result._sum).toEqual({ quantity: 100 });
  });
});
