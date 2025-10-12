## はじめに

ここはあなたがテストを書き、また、修正する際に見なければならないファイルです。

## 注意一覧

- orderby 以外のすべてのテストの toEqual に渡す配列ですが、この配列は順不同です。配列の順番が予想と違っても内容が同じであれば OK としてください。
- GASsma 自体の仕様の変更はしないでください。ここでいう仕様とは、このライブラリを使うユーザが書く GASsma の構文の仕様ことです。例えば以下の変更は禁止です。

before

```
const result = gassma.sheets.sheet2.findMany({
    distinct: ["hoge"]
    skip: 3
  });
```

after(NG❌)

```
const result = gassma.sheets.sheet2.findMany({
    distinct: {"hoge": true}
    skip: 3
  });
```

- ファイルはすべて末尾改行をしてください。これは GitHub の末尾改行警告を回避するためです。

## コードレビューで受けた改善点

### 型安全性の向上
- 適切なTypeScriptインターフェースを定義し、型安全性を確保する
- `ReturnType<typeof function>`などを活用して型推論を活用する
- モックオブジェクトに対しても適切な型定義を行う

### テストの独立性確保
- `beforeEach`フックを使用してテスト間でのモック状態のリセットを行う
- テスト間で副作用が残らないよう、各テスト実行前に初期状態に戻す
- モックデータの変更が他のテストに影響しないよう注意する

### コードの可読性向上
- マジックナンバーを避け、意味のある定数名を使用する
  - 例: `INITIAL_ROW_COUNT`, `EXPECTED_TOTAL_ROWS_AFTER_ONE_INSERT`
- テストの意図が明確になるよう、適切な変数名と定数を使用する

### 包括的なエッジケーステスト
- 正常系だけでなく、以下のエッジケースも必ずテストに含める：
  - 存在しないカラム名の処理
  - 無効なデータ型（意図的な型境界テスト）
  - 循環参照オブジェクト
  - 大量データの処理とパフォーマンステスト
  - 空文字列、null、undefined、ホワイトスペースの処理
- エラーハンドリングのテストも忘れずに実装する

### セマンティックな一貫性
- テストの説明文は統一された形式で書く
- テストグループを論理的に整理する（正常系→エッジケース→エラーハンドリング→パフォーマンス）
- 同じ機能に対するテストは一貫したパターンで記述する

## 追加のベストプラクティス（PRレビューから学習）

### 定数とコメントの最適化
- **定数の意味を明確化**: 初期データとの関係性をコメントで説明する
  ```typescript
  // 初期データ中のEngineerの数（Alice, Eve, Henry）
  const EXPECTED_ENGINEER_COUNT = 3;
  ```
- **計算ロジックの説明**: 複雑な期待値にはコメントで計算過程を記載する
  ```typescript
  // 初期データから計算:
  // Tokyo: Alice(Engineer), Eve(Engineer), Grace(Designer) = 3人
  // Kyoto: David(Manager), Henry(Engineer) = 2人
  expect(result.count).toBe(5);
  ```

### テスト期待値の精密化
- **曖昧な検証の禁止**: `toBeGreaterThan(0)`ではなく具体的な期待値を使用する
- **期待値の根拠を明示**: なぜその数値になるのかをコメントで説明する
- **エッジケースの明示的検証**: 「無視される」挙動も実際に検証コードを書く
  ```typescript
  // 存在しないカラムのデータが意図せずどこかに書き込まれていないことを確認
  const hasInvalidValue = currentData.some(row => 
    row.some(cell => cell === "無効な値")
  );
  expect(hasInvalidValue).toBe(false);
  ```

### パフォーマンステストのガイドライン
- **CI環境を考慮した閾値設定**: ローカル環境より緩い閾値を設定する
  ```typescript
  // CI環境での処理遅延を考慮
  expect(endTime - startTime).toBeLessThan(2000);
  ```
- **パフォーマンステストの目的を明確化**: 機能確認なのか性能確認なのかを明記する

### 複雑な条件のテスト
- **AND/OR/NOTの組み合わせテスト**: 複雑なクエリ条件も具体的な期待値で検証する
- **条件の漏れ防止**: 複雑な条件では、該当するレコードをコメントで列挙する

## 最新のレビューフィードバック（filterConditions・notPatternFilter改善から）

### エラーハンドリングのベストプラクティス
- **具体的なエラー型の検証**: `toThrow()`ではなく、具体的なエラークラスや名前での検証を推奨
  ```typescript
  // 推奨: 具体的なエラー名での検証
  try {
    functionThatShouldThrow();
    fail("Expected function to throw an error");
  } catch (error: any) {
    expect(error.name).toBe("SpecificErrorClassName");
  }
  
  // 非推奨: 汎用的なtoThrow()
  expect(() => functionThatShouldThrow()).toThrow();
  ```
- **カスタムエラークラスの実装**: カスタムエラーには`name`プロパティを明示的に設定する
  ```typescript
  class CustomError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "CustomError"; // 必須
    }
  }
  ```

### テストカバレッジの質の向上
- **null/undefined処理の網羅**: 全てのフィルタ条件でnull値ハンドリングをテストする
- **境界値テストの充実**: 数値比較条件（lt/lte/gt/gte）で境界値の包含・除外を明示的にテスト
- **データ型の多様性**: 文字列、数値、真偽値、小数、負数、ゼロ、空配列などを網羅的にテスト
- **空文字列の特殊処理**: equals/not条件での空文字列→null変換などの特殊ケースをテスト

### ファイル品質の標準
- **末尾改行の必須化**: 全てのテストファイルに末尾改行を追加（リンター警告回避）
- **未使用importの除去**: TypeScript診断エラーを解消し、コードの整理を徹底

### テスト設計の改善ポイント
- **重複テストの整理**: 同じ機能を異なる方法でテストしている場合は統合または明確に区別
- **テストの意図明確化**: なぜそのテストが必要なのかをコメントで説明
- **エッジケースの体系化**: 
  - 正常系 → エッジケース → エラーハンドリング → 境界値テスト の順序で整理
  - 各セクションで何をテストしているかを明記

### コードの堅牢性向上
- **型安全性の確保**: 将来のリファクタリング時の変更検知のため、具体的な型やエラー検証を実装
- **実装の詳細への依存回避**: インターフェースレベルでのテストを心がけ、実装変更に強いテストを作成
