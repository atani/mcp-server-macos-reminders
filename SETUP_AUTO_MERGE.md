# 🔄 自動マージ設定ガイド

このガイドでは、Dependabotや RenovateのPRを自動的にマージする設定方法を説明します。

## 📋 前提条件

- リポジトリの管理者権限
- GitHub Actions が有効
- ブランチ保護ルールが設定済み

## 🚀 設定手順

### 1. リポジトリで自動マージを有効化

#### GitHub CLIを使用

```bash
gh repo edit atani/mcp-server-macos-reminders --enable-auto-merge
```

#### GitHub Web UIを使用

1. リポジトリの **Settings** タブを開く
2. 左サイドバーの **General** をクリック
3. **Pull Requests** セクションまでスクロール
4. **Allow auto-merge** にチェックを入れる
5. **Save** をクリック

### 2. ブランチ保護ルールの設定

1. **Settings** → **Branches** へ移動
2. `main` ブランチのルールを編集（または新規作成）
3. 以下の設定を行う：

```
✅ Require a pull request before merging
  ✅ Require approvals: 0 (Dependabot用)
  ✅ Dismiss stale pull request approvals when new commits are pushed
  ✅ Require review from CODEOWNERS (オプション)

✅ Require status checks to pass before merging
  ✅ Require branches to be up to date before merging
  ✅ Status checks:
    - CI (18.x)
    - CI (20.x)
    - pr-title-check
    - code-quality
    - coverage-check
    - build
    - security

✅ Require conversation resolution before merging

✅ Include administrators (推奨)

✅ Allow auto-merge (重要！)
✅ Automatically delete head branches
```

### 3. GitHub Actions の権限設定

1. **Settings** → **Actions** → **General** へ移動
2. **Workflow permissions** セクションで：
   - **Read and write permissions** を選択
   - **Allow GitHub Actions to create and approve pull requests** にチェック
3. **Save** をクリック

### 4. 個別PRで自動マージを有効化

自動マージは PR ごとに有効化する必要があります：

#### GitHub CLIを使用

```bash
# PR番号を指定して自動マージを有効化
gh pr merge 1 --auto --squash --repo atani/mcp-server-macos-reminders
gh pr merge 2 --auto --squash --repo atani/mcp-server-macos-reminders
gh pr merge 3 --auto --squash --repo atani/mcp-server-macos-reminders
```

#### GitHub Web UIを使用

1. PRページを開く
2. 下部の **Enable auto-merge** ボタンをクリック
3. マージ方法を選択（Squash and merge 推奨）
4. **Confirm auto-merge** をクリック

## 🔧 トラブルシューティング

### 自動マージボタンが表示されない場合

1. **リポジトリ設定を確認**
   - `Allow auto-merge` が有効か確認
   - ブランチ保護ルールで `Allow auto-merge` が有効か確認

2. **権限を確認**
   - PRを作成したユーザー（Dependabot）に権限があるか
   - GitHub Actions に write 権限があるか

3. **ステータスチェックを確認**
   - 必須のステータスチェックが定義されているか
   - 全てのチェックが通過しているか

### 自動マージが実行されない場合

1. **PR の状態を確認**

   ```bash
   gh pr view 1 --json autoMergeRequest
   ```

2. **マージ可能状態を確認**

   ```bash
   gh pr view 1 --json mergeable,mergeStateStatus
   ```

3. **ログを確認**
   - Actions タブで auto-merge ワークフローのログを確認

## 📊 現在のPRに自動マージを適用

現在開いているDependabot PRに自動マージを設定：

```bash
# PR #1: tj-actions/changed-files
gh pr merge 1 --auto --squash --repo atani/mcp-server-macos-reminders

# PR #2: hmarr/auto-approve-action
gh pr merge 2 --auto --squash --repo atani/mcp-server-macos-reminders

# PR #3: codecov/codecov-action
gh pr merge 3 --auto --squash --repo atani/mcp-server-macos-reminders
```

## 🎯 期待される動作

設定が完了すると：

1. DependabotがPRを作成
2. CIテストが自動実行
3. 全てのチェックが通過
4. 自動的にマージ実行
5. ブランチが自動削除

## 🔐 セキュリティ考慮事項

- メジャーアップデートは自動マージから除外することを推奨
- セキュリティアップデートは優先的に処理
- 定期的に自動マージされたPRをレビュー

## 📚 関連ドキュメント

- [GitHub Docs: Auto-merge](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/automatically-merging-a-pull-request)
- [Dependabot Configuration](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file)
