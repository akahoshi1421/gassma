import { applySelectCount } from "../../../../util/find/findUtil/applySelectCount";
import type { Select } from "../../../../types/coreTypes";
import type {
  RelationContext,
  RelationDefinition,
} from "../../../../types/relationTypes";

describe("applySelectCount", () => {
  const mockFindMany = jest.fn();

  const relations: { [name: string]: RelationDefinition } = {
    posts: {
      type: "oneToMany",
      to: "Posts",
      field: "id",
      reference: "authorId",
    },
    profile: {
      type: "oneToOne",
      to: "Profiles",
      field: "id",
      reference: "userId",
    },
  };

  const context: RelationContext = {
    relations,
    findManyOnSheet: mockFindMany,
  };

  beforeEach(() => {
    mockFindMany.mockReset();
  });

  it("スカラー select + _count で両方返す", () => {
    const records = [{ id: 1, name: "Alice", email: "alice@example.com" }];
    const countValue = { select: { posts: true } };
    const scalarSelect: Select = { name: true };

    mockFindMany.mockReturnValue([
      { id: 101, authorId: 1 },
      { id: 102, authorId: 1 },
    ]);

    const result = applySelectCount(records, countValue, scalarSelect, context);

    expect(result).toEqual([{ name: "Alice", _count: { posts: 2 } }]);
  });

  it("_count のみ（スカラー select なし）で _count だけ返す", () => {
    const records = [{ id: 1, name: "Alice" }];
    const countValue = { select: { posts: true } };

    mockFindMany.mockReturnValue([{ id: 101, authorId: 1 }]);

    const result = applySelectCount(records, countValue, null, context);

    expect(result).toEqual([{ _count: { posts: 1 } }]);
  });

  it("複数の親レコードに対して正しく動作する", () => {
    const records = [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ];
    const countValue = { select: { posts: true } };
    const scalarSelect: Select = { name: true };

    mockFindMany.mockReturnValue([
      { id: 101, authorId: 1 },
      { id: 102, authorId: 1 },
      { id: 103, authorId: 2 },
    ]);

    const result = applySelectCount(records, countValue, scalarSelect, context);

    expect(result).toEqual([
      { name: "Alice", _count: { posts: 2 } },
      { name: "Bob", _count: { posts: 1 } },
    ]);
  });

  it("_count: true で全リレーションカウント", () => {
    const records = [{ id: 1, name: "Alice" }];
    const countValue = true;
    const scalarSelect: Select = { name: true };

    // posts
    mockFindMany.mockReturnValueOnce([{ id: 101, authorId: 1 }]);
    // profile
    mockFindMany.mockReturnValueOnce([{ id: 10, userId: 1 }]);

    const result = applySelectCount(records, countValue, scalarSelect, context);

    expect(result).toEqual([
      { name: "Alice", _count: { posts: 1, profile: 1 } },
    ]);
  });
});
