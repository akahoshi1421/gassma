import { groupByFunc } from "../../../util/groupby/groupby";
import { getExtendedMockControllerUtil } from "../../consts/mockControllerUtil";
import { expectArrayToEqualIgnoringOrder } from "../../helpers/matchers";

describe("groupBy functionality tests", () => {
  describe("groupByFunc with basic grouping", () => {
    test("should group by a single field", () => {
      const result = groupByFunc(getExtendedMockControllerUtil(), {
        by: "住所"
      });

      expectArrayToEqualIgnoringOrder(result, [
        { 住所: "Tokyo" },
        { 住所: "Osaka" },
        { 住所: "Kyoto" }
      ]);
    });

    test("should group by multiple fields", () => {
      const result = groupByFunc(getExtendedMockControllerUtil(), {
        by: ["住所", "職業"]
      });

      expectArrayToEqualIgnoringOrder(result, [
        { 住所: "Tokyo", 職業: "Engineer" },
        { 住所: "Osaka", 職業: "Designer" },
        { 住所: "Tokyo", 職業: "Student" },
        { 住所: "Kyoto", 職業: "Manager" },
        { 住所: "Osaka", 職業: "Director" },
        { 住所: "Tokyo", 職業: "Designer" },
        { 住所: "Kyoto", 職業: "Engineer" }
      ]);
    });

    test("should handle string parameter for by", () => {
      const result = groupByFunc(getExtendedMockControllerUtil(), {
        by: "職業"
      });

      expectArrayToEqualIgnoringOrder(result, [
        { 職業: "Engineer" },
        { 職業: "Designer" },
        { 職業: "Student" },
        { 職業: "Manager" },
        { 職業: "Director" }
      ]);
    });
  });

  describe("groupByFunc with statistics", () => {
    test("should calculate _avg for grouped data", () => {
      const result = groupByFunc(getExtendedMockControllerUtil(), {
        by: "住所",
        _avg: { 年齢: true }
      });

      expectArrayToEqualIgnoringOrder(result, [
        { 住所: "Tokyo", _avg: { 年齢: (28 + 22 + 28 + 31) / 4 } },
        { 住所: "Osaka", _avg: { 年齢: (35 + 52) / 2 } },
        { 住所: "Kyoto", _avg: { 年齢: (45 + 28) / 2 } }
      ]);
    });

    test("should calculate _count for grouped data", () => {
      const result = groupByFunc(getExtendedMockControllerUtil(), {
        by: "住所",
        _count: { 名前: true }
      });

      expectArrayToEqualIgnoringOrder(result, [
        { 住所: "Tokyo", _count: { 名前: 4 } },
        { 住所: "Osaka", _count: { 名前: 2 } },
        { 住所: "Kyoto", _count: { 名前: 2 } }
      ]);
    });

    test("should calculate _max and _min for grouped data", () => {
      const result = groupByFunc(getExtendedMockControllerUtil(), {
        by: "住所",
        _max: { 年齢: true },
        _min: { 年齢: true }
      });

      expectArrayToEqualIgnoringOrder(result, [
        { 住所: "Tokyo", _max: { 年齢: 31 }, _min: { 年齢: 22 } },
        { 住所: "Osaka", _max: { 年齢: 52 }, _min: { 年齢: 35 } },
        { 住所: "Kyoto", _max: { 年齢: 45 }, _min: { 年齢: 28 } }
      ]);
    });

    test("should calculate _sum for grouped data", () => {
      const result = groupByFunc(getExtendedMockControllerUtil(), {
        by: "職業",
        _sum: { 年齢: true }
      });

      expectArrayToEqualIgnoringOrder(result, [
        { 職業: "Engineer", _sum: { 年齢: 28 + 28 + 28 } },
        { 職業: "Designer", _sum: { 年齢: 35 + 31 } },
        { 職業: "Student", _sum: { 年齢: 22 } },
        { 職業: "Manager", _sum: { 年齢: 45 } },
        { 職業: "Director", _sum: { 年齢: 52 } }
      ]);
    });

    test("should calculate multiple statistics for grouped data", () => {
      const result = groupByFunc(getExtendedMockControllerUtil(), {
        by: "住所",
        _avg: { 年齢: true },
        _count: { 名前: true },
        _max: { 年齢: true }
      });

      expectArrayToEqualIgnoringOrder(result, [
        { 
          住所: "Tokyo", 
          _avg: { 年齢: (28 + 22 + 28 + 31) / 4 }, 
          _count: { 名前: 4 },
          _max: { 年齢: 31 }
        },
        { 
          住所: "Osaka", 
          _avg: { 年齢: (35 + 52) / 2 }, 
          _count: { 名前: 2 },
          _max: { 年齢: 52 }
        },
        { 
          住所: "Kyoto", 
          _avg: { 年齢: (45 + 28) / 2 }, 
          _count: { 名前: 2 },
          _max: { 年齢: 45 }
        }
      ]);
    });
  });

  describe("groupByFunc with where conditions", () => {
    test("should work with simple where condition", () => {
      const result = groupByFunc(getExtendedMockControllerUtil(), {
        by: "住所",
        where: { 年齢: { gte: 30 } },
        _count: { 名前: true }
      });

      expectArrayToEqualIgnoringOrder(result, [
        { 住所: "Osaka", _count: { 名前: 2 } },
        { 住所: "Kyoto", _count: { 名前: 1 } },
        { 住所: "Tokyo", _count: { 名前: 1 } }
      ]);
    });

    test("should work with complex where condition", () => {
      const result = groupByFunc(getExtendedMockControllerUtil(), {
        by: "職業",
        where: { 住所: "Tokyo" },
        _avg: { 年齢: true }
      });

      expectArrayToEqualIgnoringOrder(result, [
        { 職業: "Engineer", _avg: { 年齢: 28 } },
        { 職業: "Student", _avg: { 年齢: 22 } },
        { 職業: "Designer", _avg: { 年齢: 31 } }
      ]);
    });
  });

  describe("groupByFunc with having clause", () => {
    test("should filter groups with having condition - average age", () => {
      const result = groupByFunc(getExtendedMockControllerUtil(), {
        by: "住所",
        having: {
          年齢: {
            _avg: { lte: 30 }
          }
        },
        _avg: { 年齢: true }
      });

      // Only Tokyo should pass (avg age = 27.25) and Kyoto (avg age = 36.5) should be filtered out
      expectArrayToEqualIgnoringOrder(result, [
        { 住所: "Tokyo", _avg: { 年齢: (28 + 22 + 28 + 31) / 4 } }
      ]);
    });

    test("should filter groups with having condition - count", () => {
      const result = groupByFunc(getExtendedMockControllerUtil(), {
        by: "住所",
        having: {
          名前: {
            _count: { gte: 3 }
          }
        },
        _count: { 名前: true }
      });

      // Only Tokyo should pass (count = 4)
      expectArrayToEqualIgnoringOrder(result, [
        { 住所: "Tokyo", _count: { 名前: 4 } }
      ]);
    });

    test("should filter groups with having condition - max age", () => {
      const result = groupByFunc(getExtendedMockControllerUtil(), {
        by: "住所",
        having: {
          年齢: {
            _max: { gte: 50 }
          }
        },
        _max: { 年齢: true }
      });

      // Only Osaka should pass (max age = 52)
      expectArrayToEqualIgnoringOrder(result, [
        { 住所: "Osaka", _max: { 年齢: 52 } }
      ]);
    });

    test("should filter groups with having AND condition", () => {
      const result = groupByFunc(getExtendedMockControllerUtil(), {
        by: "住所",
        having: {
          AND: [
            {
              年齢: {
                _avg: { gte: 25 }
              }
            },
            {
              名前: {
                _count: { gte: 2 }
              }
            }
          ]
        },
        _avg: { 年齢: true },
        _count: { 名前: true }
      });

      // Only groups with avg age >= 25 AND count >= 2 should pass
      // Tokyo: avg=27.25, count=4 ✓
      // Osaka: avg=43.5, count=2 ✓
      // Kyoto: avg=36.5, count=2 ✓
      expectArrayToEqualIgnoringOrder(result, [
        { 住所: "Tokyo", _avg: { 年齢: (28 + 22 + 28 + 31) / 4 }, _count: { 名前: 4 } },
        { 住所: "Osaka", _avg: { 年齢: (35 + 52) / 2 }, _count: { 名前: 2 } },
        { 住所: "Kyoto", _avg: { 年齢: (45 + 28) / 2 }, _count: { 名前: 2 } }
      ]);
    });

    test("should filter groups with having OR condition", () => {
      const result = groupByFunc(getExtendedMockControllerUtil(), {
        by: "住所",
        having: {
          OR: [
            {
              年齢: {
                _avg: { lte: 28 }
              }
            },
            {
              年齢: {
                _max: { gte: 50 }
              }
            }
          ]
        },
        _avg: { 年齢: true },
        _max: { 年齢: true }
      });

      // Groups with avg age <= 28 OR max age >= 50 should pass
      // Tokyo: avg=27.25 ✓, max=31
      // Osaka: avg=43.5, max=52 ✓
      // Kyoto: avg=36.5, max=45 ✗
      expectArrayToEqualIgnoringOrder(result, [
        { 住所: "Tokyo", _avg: { 年齢: (28 + 22 + 28 + 31) / 4 }, _max: { 年齢: 31 } },
        { 住所: "Osaka", _avg: { 年齢: (35 + 52) / 2 }, _max: { 年齢: 52 } }
      ]);
    });

    test("should filter groups with having NOT condition", () => {
      const result = groupByFunc(getExtendedMockControllerUtil(), {
        by: "住所",
        having: {
          NOT: [
            {
              年齢: {
                _avg: { gte: 35 }
              }
            }
          ]
        },
        _avg: { 年齢: true }
      });

      // Groups with NOT (avg age >= 35) should pass
      // Tokyo: avg=27.25 ✓ (NOT >= 35)
      // Osaka: avg=43.5 ✗ (>= 35)
      // Kyoto: avg=36.5 ✗ (>= 35)
      expectArrayToEqualIgnoringOrder(result, [
        { 住所: "Tokyo", _avg: { 年齢: (28 + 22 + 28 + 31) / 4 } }
      ]);
    });

    test("should filter groups with complex having condition - AND with OR", () => {
      const result = groupByFunc(getExtendedMockControllerUtil(), {
        by: "住所",
        having: {
          AND: [
            {
              名前: {
                _count: { gte: 2 }
              }
            },
            {
              OR: [
                {
                  年齢: {
                    _avg: { lte: 30 }
                  }
                },
                {
                  年齢: {
                    _max: { gte: 50 }
                  }
                }
              ]
            }
          ]
        },
        _avg: { 年齢: true },
        _count: { 名前: true },
        _max: { 年齢: true }
      });

      // Groups with count >= 2 AND (avg <= 30 OR max >= 50) should pass
      // Tokyo: count=4 ✓, avg=27.25 ✓, max=31 → ✓
      // Osaka: count=2 ✓, avg=43.5, max=52 ✓ → ✓
      // Kyoto: count=2 ✓, avg=36.5, max=45 → ✗
      expectArrayToEqualIgnoringOrder(result, [
        { 住所: "Tokyo", _avg: { 年齢: (28 + 22 + 28 + 31) / 4 }, _count: { 名前: 4 }, _max: { 年齢: 31 } },
        { 住所: "Osaka", _avg: { 年齢: (35 + 52) / 2 }, _count: { 名前: 2 }, _max: { 年齢: 52 } }
      ]);
    });

    test("should filter groups with complex having condition - NOT with AND", () => {
      const result = groupByFunc(getExtendedMockControllerUtil(), {
        by: "住所",
        having: {
          NOT: [
            {
              AND: [
                {
                  年齢: {
                    _avg: { gte: 35 }
                  }
                },
                {
                  年齢: {
                    _max: { lte: 45 }
                  }
                }
              ]
            }
          ]
        },
        _avg: { 年齢: true },
        _max: { 年齢: true }
      });

      // Groups with NOT (avg >= 35 AND max <= 45) should pass
      // Tokyo: avg=27.25, max=31 → NOT (False) ✓
      // Osaka: avg=43.5, max=52 → NOT (False) ✓
      // Kyoto: avg=36.5, max=45 → NOT (True) ✗
      expectArrayToEqualIgnoringOrder(result, [
        { 住所: "Tokyo", _avg: { 年齢: (28 + 22 + 28 + 31) / 4 }, _max: { 年齢: 31 } },
        { 住所: "Osaka", _avg: { 年齢: (35 + 52) / 2 }, _max: { 年齢: 52 } }
      ]);
    });

    test("should filter groups with nested having condition - OR with nested AND", () => {
      const result = groupByFunc(getExtendedMockControllerUtil(), {
        by: "住所",
        having: {
          OR: [
            {
              AND: [
                {
                  年齢: {
                    _avg: { lte: 30 }
                  }
                },
                {
                  名前: {
                    _count: { gte: 3 }
                  }
                }
              ]
            },
            {
              年齢: {
                _min: { gte: 35 }
              }
            }
          ]
        },
        _avg: { 年齢: true },
        _count: { 名前: true },
        _min: { 年齢: true }
      });

      // Groups with (avg <= 30 AND count >= 3) OR min >= 35 should pass
      // Tokyo: avg=27.25 ✓, count=4 ✓, min=22 → ✓
      // Osaka: avg=43.5, count=2, min=35 ✓ → ✓
      // Kyoto: avg=36.5, count=2, min=28 → ✗
      expectArrayToEqualIgnoringOrder(result, [
        { 住所: "Tokyo", _avg: { 年齢: (28 + 22 + 28 + 31) / 4 }, _count: { 名前: 4 }, _min: { 年齢: 22 } },
        { 住所: "Osaka", _avg: { 年齢: (35 + 52) / 2 }, _count: { 名前: 2 }, _min: { 年齢: 35 } }
      ]);
    });

    test("should filter groups with multiple statistics in having condition", () => {
      const result = groupByFunc(getExtendedMockControllerUtil(), {
        by: "住所",
        having: {
          AND: [
            {
              年齢: {
                _avg: { gte: 25 }
              }
            },
            {
              年齢: {
                _sum: { lte: 100 }
              }
            },
            {
              名前: {
                _count: { gte: 2 }
              }
            }
          ]
        },
        _avg: { 年齢: true },
        _sum: { 年齢: true },
        _count: { 名前: true }
      });

      // Groups with avg >= 25 AND sum <= 100 AND count >= 2 should pass
      // Tokyo: avg=27.25 ✓, sum=109 ✗, count=4 ✓ → ✗
      // Osaka: avg=43.5 ✓, sum=87 ✓, count=2 ✓ → ✓
      // Kyoto: avg=36.5 ✓, sum=73 ✓, count=2 ✓ → ✓
      expectArrayToEqualIgnoringOrder(result, [
        { 住所: "Osaka", _avg: { 年齢: (35 + 52) / 2 }, _sum: { 年齢: 35 + 52 }, _count: { 名前: 2 } },
        { 住所: "Kyoto", _avg: { 年齢: (45 + 28) / 2 }, _sum: { 年齢: 45 + 28 }, _count: { 名前: 2 } }
      ]);
    });

    test("should filter groups with deeply nested having condition", () => {
      const result = groupByFunc(getExtendedMockControllerUtil(), {
        by: "住所",
        having: {
          OR: [
            {
              AND: [
                {
                  NOT: [
                    {
                      年齢: {
                        _max: { gte: 50 }
                      }
                    }
                  ]
                },
                {
                  名前: {
                    _count: { gte: 2 }
                  }
                }
              ]
            },
            {
              年齢: {
                _avg: { lte: 25 }
              }
            }
          ]
        },
        _avg: { 年齢: true },
        _count: { 名前: true },
        _max: { 年齢: true }
      });

      // Groups with (NOT(max >= 50) AND count >= 2) OR avg <= 25 should pass
      // Tokyo: NOT(31 >= 50) ✓, count=4 ✓, avg=27.25 → ✓
      // Osaka: NOT(52 >= 50) ✗, count=2 ✓, avg=43.5 → ✗
      // Kyoto: NOT(45 >= 50) ✓, count=2 ✓, avg=36.5 → ✓
      expectArrayToEqualIgnoringOrder(result, [
        { 住所: "Tokyo", _avg: { 年齢: (28 + 22 + 28 + 31) / 4 }, _count: { 名前: 4 }, _max: { 年齢: 31 } },
        { 住所: "Kyoto", _avg: { 年齢: (45 + 28) / 2 }, _count: { 名前: 2 }, _max: { 年齢: 45 } }
      ]);
    });
  });

  describe("groupByFunc with orderBy, skip, and take", () => {
    test("should work with orderBy", () => {
      const result = groupByFunc(getExtendedMockControllerUtil(), {
        by: "住所",
        orderBy: { 年齢: "desc" },
        _avg: { 年齢: true }
      });

      // orderBy should not affect the grouping results, only the order of processing
      expectArrayToEqualIgnoringOrder(result, [
        { 住所: "Tokyo", _avg: { 年齢: (28 + 22 + 28 + 31) / 4 } },
        { 住所: "Osaka", _avg: { 年齢: (35 + 52) / 2 } },
        { 住所: "Kyoto", _avg: { 年齢: (45 + 28) / 2 } }
      ]);
    });

    test("should work with skip", () => {
      const result = groupByFunc(getExtendedMockControllerUtil(), {
        by: "住所",
        skip: 2,
        _count: { 名前: true }
      });

      // Skip should affect the input data before grouping
      expectArrayToEqualIgnoringOrder(result, [
        { 住所: "Tokyo", _count: { 名前: 3 } },
        { 住所: "Kyoto", _count: { 名前: 2 } },
        { 住所: "Osaka", _count: { 名前: 1 } }
      ]);
    });

    test("should work with take", () => {
      const result = groupByFunc(getExtendedMockControllerUtil(), {
        by: "住所",
        take: 4,
        _count: { 名前: true }
      });

      // Take should limit input data before grouping
      expectArrayToEqualIgnoringOrder(result, [
        { 住所: "Tokyo", _count: { 名前: 2 } },
        { 住所: "Osaka", _count: { 名前: 1 } },
        { 住所: "Kyoto", _count: { 名前: 1 } }
      ]);
    });
  });

  describe("groupByFunc edge cases", () => {
    test("should handle no matching records with where", () => {
      const result = groupByFunc(getExtendedMockControllerUtil(), {
        by: "住所",
        where: { 名前: "NonExistent" },
        _count: { 名前: true }
      });

      expect(result).toEqual([]);
    });

    test("should handle take=0", () => {
      const result = groupByFunc(getExtendedMockControllerUtil(), {
        by: "住所",
        take: 0,
        _count: { 名前: true }
      });

      expect(result).toEqual([]);
    });

    test("should handle skip exceeding total records", () => {
      const result = groupByFunc(getExtendedMockControllerUtil(), {
        by: "住所",
        skip: 20,
        _count: { 名前: true }
      });

      expect(result).toEqual([]);
    });

    test("should handle grouping with all statistics", () => {
      const result = groupByFunc(getExtendedMockControllerUtil(), {
        by: "職業",
        where: { 職業: "Engineer" },
        _avg: { 年齢: true },
        _count: { 名前: true },
        _max: { 年齢: true },
        _min: { 年齢: true },
        _sum: { 年齢: true }
      });

      expect(result).toEqual([
        {
          職業: "Engineer",
          _avg: { 年齢: 28 },
          _count: { 名前: 3 },
          _max: { 年齢: 28 },
          _min: { 年齢: 28 },
          _sum: { 年齢: 84 }
        }
      ]);
    });
  });

  describe("groupByFunc with complex scenarios", () => {
    test("should work with multiple grouping fields and statistics", () => {
      const result = groupByFunc(getExtendedMockControllerUtil(), {
        by: ["住所", "職業"],
        where: { 住所: "Tokyo" },
        _avg: { 年齢: true },
        _count: { 名前: true }
      });

      expectArrayToEqualIgnoringOrder(result, [
        { 住所: "Tokyo", 職業: "Engineer", _avg: { 年齢: 28 }, _count: { 名前: 2 } },
        { 住所: "Tokyo", 職業: "Student", _avg: { 年齢: 22 }, _count: { 名前: 1 } },
        { 住所: "Tokyo", 職業: "Designer", _avg: { 年齢: 31 }, _count: { 名前: 1 } }
      ]);
    });

    test("should combine where, having, and statistics", () => {
      const result = groupByFunc(getExtendedMockControllerUtil(), {
        by: "住所",
        where: { 年齢: { gte: 25 } },
        having: {
          年齢: {
            _avg: { gte: 30 }
          }
        },
        _avg: { 年齢: true },
        _count: { 名前: true }
      });

      // After where filter (age >= 25), only groups with avg age >= 30 should remain
      expectArrayToEqualIgnoringOrder(result, [
        { 住所: "Osaka", _avg: { 年齢: (35 + 52) / 2 }, _count: { 名前: 2 } },
        { 住所: "Kyoto", _avg: { 年齢: (45 + 28) / 2 }, _count: { 名前: 2 } }
      ]);
    });
  });
});

