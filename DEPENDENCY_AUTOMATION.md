# 🔄 依存関係自動更新システム

このプロジェクトでは、依存関係の自動更新と管理のために以下のツールとワークフローを使用しています。

## 📦 使用ツール

### 1. **Dependabot** (基本的な更新)
- GitHubネイティブの依存関係更新ツール
- 週次でnpmパッケージとGitHub Actionsを更新
- セキュリティ脆弱性の自動検出と修正

### 2. **Renovate** (高度な更新管理)
- より高度な設定が可能な依存関係管理ツール
- パッケージのグループ化と自動マージ設定
- 更新の安定性チェック（3日間の待機期間）

## 🔧 自動化の仕組み

### 更新フロー

1. **依存関係の検出**
   - Dependabot/Renovateが週次で更新をチェック
   - セキュリティ更新は即座に検出

2. **プルリクエストの作成**
   - 更新ごとに自動的にPRを作成
   - 適切なラベル付け（`dependencies`, `automated`）
   - コミットメッセージの標準化

3. **自動テストの実行**
   - CI/CDパイプラインで全テストを実行
   - リンターとフォーマッターの自動修正
   - テストカバレッジの確認

4. **自動マージ**
   - マイナー・パッチ更新: テスト通過後に自動マージ
   - メジャー更新: 手動レビューが必要
   - セキュリティ更新: 優先的に処理

## 📋 設定ファイル

### `.github/dependabot.yml`
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    schedule:
      interval: "weekly"
    groups:
      production-dependencies:
        dependency-type: "production"
      development-dependencies:
        dependency-type: "development"
```

### `.github/renovate.json`
```json
{
  "extends": ["config:recommended"],
  "automerge": true,
  "automergeType": "pr",
  "packageRules": [
    {
      "matchUpdateTypes": ["minor", "patch"],
      "automerge": true
    }
  ]
}
```

## 🚀 GitHub Actions ワークフロー

### 1. **Auto Merge** (`.github/workflows/auto-merge.yml`)
- Dependabot/RenovateのPRを自動マージ
- 全テスト通過とマージ可能状態をチェック
- セキュリティ更新の優先処理

### 2. **Dependency Review** (`.github/workflows/dependency-review.yml`)
- ライセンスチェック（許可: MIT, Apache-2.0等）
- 脆弱性スキャン
- Breaking changesの検出と警告

### 3. **PR Checks - Auto Fix** (`.github/workflows/pr-checks.yml`)
- リンティングエラーの自動修正
- コードフォーマットの自動適用
- 修正内容の自動コミット

## 🛡️ セキュリティ設定

### 脆弱性対応
- **高・重大**: 即座にPR作成、優先マージ
- **中程度**: 通常の更新フローで処理
- **低**: バッチ更新で処理

### ライセンス管理
- **許可**: MIT, Apache-2.0, BSD, ISC
- **拒否**: GPL-3.0, AGPL-3.0
- 新しいライセンスは手動レビュー必須

## 📊 ダッシュボード

Renovateは依存関係更新ダッシュボードを提供：
- 保留中の更新一覧
- 更新のグループ化状況
- ブロックされている更新の理由

## 🔍 トラブルシューティング

### 自動マージが動作しない場合

1. **ブランチ保護ルールの確認**
   - 必要なステータスチェックが設定されているか
   - 自動マージが許可されているか

2. **権限の確認**
   - GitHub ActionsにWrite権限があるか
   - Dependabot/Renovateのアクセス権限

3. **テストの失敗**
   - CI/CDログを確認
   - 自動修正で解決できない問題がないか

### 手動介入が必要な場合

- **メジャーバージョン更新**: Breaking changesの確認
- **新しい依存関係**: セキュリティとライセンスのレビュー
- **テスト失敗**: コードの手動修正が必要

## 📝 運用ガイドライン

1. **定期的な確認**
   - 週次でダッシュボードを確認
   - ブロックされている更新の対処

2. **メジャー更新の計画**
   - 四半期ごとにメジャー更新を検討
   - Breaking changesのドキュメント化

3. **セキュリティ優先**
   - セキュリティ更新は最優先で対応
   - 脆弱性レポートの定期確認

## 🎯 カスタマイズ

プロジェクトの要件に応じて以下をカスタマイズ可能：

- 更新スケジュール（曜日・時間）
- 自動マージの条件
- パッケージのグループ化
- 特定パッケージの更新除外

詳細は各設定ファイルのコメントを参照してください。