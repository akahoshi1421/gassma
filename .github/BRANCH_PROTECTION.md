# Branch Protection Setup

このドキュメントでは、PRがマージ前にCIテストを必須にするためのブランチ保護ルールの設定方法を説明します。

## 設定手順

### 1. GitHubリポジトリの設定画面にアクセス

1. GitHubでリポジトリページを開く
2. **Settings** タブをクリック
3. 左サイドバーの **Branches** をクリック

### 2. ブランチ保護ルールの追加

1. **Add rule** ボタンをクリック
2. **Branch name pattern** に `main` を入力

### 3. 保護設定の構成

以下の設定を有効にします：

#### ✅ 必須設定
- **Require a pull request before merging**
  - **Require approvals**: 1 (レビュー必須)
  - **Dismiss stale reviews when new commits are pushed**: ✓
  
- **Require status checks to pass before merging**
  - **Require branches to be up to date before merging**: ✓
  - **Status checks to require**:
    - `test (18.x)` - Node.js 18でのテスト
    - `test (20.x)` - Node.js 20でのテスト
    - `lint` - TypeScript型チェック
    - `build` - ビルドチェック

#### ✅ 推奨設定
- **Restrict pushes that create files**: ✓ (直接pushを防ぐ)
- **Do not allow bypassing the above settings**: ✓ (管理者も従う)

### 4. 設定の保存

**Create** ボタンをクリックして設定を保存します。

## 設定後の動作

### PRマージの条件
1. ✅ 最低1人のレビュー承認
2. ✅ 全てのCIテストが通過
3. ✅ ブランチが最新の状態
4. ✅ TypeScript型チェック通過
5. ✅ ビルド成功

### CIの実行タイミング
- PR作成時
- PR更新時（新しいコミット追加時）
- mainブランチへのpush時

これらの条件を満たさない限り、PRはマージできません。

## トラブルシューティング

### CIが失敗する場合
1. ローカルで `npm test` を実行してテストを確認
2. `npx tsc --noEmit` でTypeScriptエラーを確認
3. `npm run build` でビルドエラーを確認

### ステータスチェックが表示されない場合
1. CI.ymlが正しく設定されているか確認
2. 最初のPRでCIが実行された後に設定する
3. Actions タブでCIジョブが正常に実行されているか確認