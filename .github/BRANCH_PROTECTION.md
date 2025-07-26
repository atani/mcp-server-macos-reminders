# Branch Protection Setup

このプロジェクトでテストが通らないとマージできないようにするため、以下の手順でブランチ保護ルールを設定してください。

## 1. GitHubリポジトリでの設定手順

### Step 1: リポジトリのSettings画面を開く
1. GitHubリポジトリページで「Settings」タブをクリック
2. 左サイドバーの「Code and automation」セクションで「Branches」をクリック

### Step 2: ブランチ保護ルールを追加
1. 「Add rule」ボタンをクリック
2. 「Branch name pattern」に `main` を入力

### Step 3: 保護ルールを設定
以下の項目にチェックを入れてください：

#### 必須の設定
- ✅ **Require a pull request before merging**
  - ✅ Require approvals (1以上に設定)
  - ✅ Dismiss stale PR approvals when new commits are pushed
  - ✅ Require review from code owners

- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - 以下のステータスチェックを必須に設定：
    - `test (18.x)` - Node.js 18でのテスト
    - `test (20.x)` - Node.js 20でのテスト
    - `test-macos` - macOS統合テスト
    - `build` - ビルド検証
    - `security` - セキュリティ監査
    - `pr-title-check` - PRタイトル形式チェック
    - `changed-files` - 変更ファイル検証
    - `code-quality` - コード品質チェック
    - `coverage-check` - カバレッジチェック
    - `deps-validation` - 依存関係検証

#### 推奨の設定
- ✅ **Require linear history** - マージコミットを強制してクリーンな履歴を保持
- ✅ **Do not allow bypassing the above settings** - 管理者も保護ルールに従う
- ✅ **Restrict pushes that create files** - 直接pushを制限

### Step 4: ルールを保存
「Create」ボタンをクリックして保護ルールを保存

## 2. 追加の設定（推奨）

### developブランチの保護
同様の手順で `develop` ブランチにも保護ルールを設定することを推奨します。

### CODEOWNERSファイルの設定
コードレビューを強制するため、`.github/CODEOWNERS` ファイルを作成：

```
# Global owners
* @your-github-username

# Core source code
/src/ @your-github-username
/tests/ @your-github-username

# Configuration files
package.json @your-github-username
tsconfig.json @your-github-username
/.github/ @your-github-username
```

## 3. ワークフローの動作確認

### テスト用PRの作成
1. 新しいfeatureブランチを作成
2. 適当な変更をコミット
3. PRを作成
4. 全てのチェックが実行されることを確認
5. チェックが通るまでマージボタンが無効化されることを確認

### 失敗ケースのテスト
1. テストが失敗するような変更を作成
2. PRで失敗したチェックを確認
3. マージがブロックされることを確認

## 4. 緊急時の対応

### ホットフィックスの場合
緊急修正が必要な場合：
1. `hotfix/` プレフィックスのブランチを作成
2. 最小限の変更を実装
3. レビューを経てマージ
4. 必要に応じて一時的に保護ルールを調整

### チェックの一時的な無効化
管理者権限で一時的にチェックを無効化する場合：
1. Settings > Branches で該当ルールを編集
2. 必要なチェックのみを一時的に無効化
3. 緊急対応完了後、即座に再有効化

## 5. トラブルシューティング

### よくある問題

#### ステータスチェックが表示されない
- ワークフローが最低1回は実行されている必要があります
- PRを作成してワークフローを実行後、設定画面で選択可能になります

#### macOSテストがスキップされる
- macOSランナーでの統合テストは権限の問題でスキップされる場合があります
- これは正常な動作です

#### カバレッジチェックが失敗する
- カバレッジが80%を下回る場合は失敗します
- テストを追加するか、閾値を調整してください

## 6. 設定の確認

設定完了後、以下が動作することを確認してください：

- [ ] テストが失敗するとPRがマージできない
- [ ] 全てのチェックが通るとマージボタンが有効になる
- [ ] レビュー承認が必要
- [ ] 直接mainブランチにpushできない
- [ ] ブランチが最新でないとマージできない

これらの設定により、コードの品質と安定性が保たれます。