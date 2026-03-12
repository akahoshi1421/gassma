import { resolveCodeName } from "../../../util/map/mapSheetName";

describe("resolveCodeName", () => {
  it("シート名からコード名に変換する", () => {
    const mapping = { Users: "ユーザー一覧", Posts: "投稿" };
    expect(resolveCodeName("ユーザー一覧", mapping)).toBe("Users");
  });

  it("マッピングにないシート名はそのまま返す", () => {
    const mapping = { Users: "ユーザー一覧" };
    expect(resolveCodeName("Posts", mapping)).toBe("Posts");
  });

  it("空のマッピングならそのまま返す", () => {
    expect(resolveCodeName("ユーザー一覧", {})).toBe("ユーザー一覧");
  });
});
