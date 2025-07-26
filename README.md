# macOS Reminders MCP Server

Claude CodeからmacOSの標準リマインダーアプリを直接操作できるMCP (Model Context
Protocol) サーバーです。

## 🚀 機能

- ✅ リマインダーリストの一覧取得
- ✅ リマインダーの作成・完了・削除
- ✅ キーワード検索
- ✅ 期限日設定
- ✅ Claude Codeからの自然言語操作

## 📋 必要な環境

- macOS (AppleScriptを使用)
- Node.js 18以降
- Claude Code

## 🛠️ インストール

### 1. リポジトリのクローン

```bash
git clone https://github.com/atani/mcp-server-macos-reminders.git
cd mcp-server-macos-reminders
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. ビルド

```bash
npm run build
```

### 4. Claude Code設定

Claude
Codeの設定ファイル（`~/.config/claude/claude_desktop_config.json`または`~/Library/Application Support/Claude/claude_desktop_config.json`）に以下を追加：

```json
{
  "mcpServers": {
    "reminders": {
      "command": "node",
      "args": ["/path/to/mcp-server-macos-reminders/dist/index.js"],
      "env": {}
    }
  }
}
```

**重要**:
`/path/to/mcp-server-macos-reminders`を実際のプロジェクトパスに変更してください。

### 5. macOSプライバシー設定

1. **システム設定** > **プライバシーとセキュリティ** > **リマインダー**を開く
2. **ターミナル**（またはClaude
   Codeが使用するアプリ）にリマインダーへのアクセス権限を付与

## 🎯 使用方法

### 基本的な操作

#### リマインダーリストの確認

```
> リマインダーのリスト一覧を表示して
```

#### 新しいリマインダーの作成

```
> 「仕事」リストに「会議の準備」というリマインダーを追加して

> 「買うもの」リストに「牛乳を買う」を明日の17時までに追加して
```

#### リマインダーの完了

```
> 「仕事」リストの「会議の準備」を完了にして
```

#### リマインダーの検索

```
> 「動画」に関するリマインダーを検索して

> 未完了のリマインダーを「仕事」リストから検索して
```

#### リマインダーの削除

```
> 「買うもの」リストの「牛乳を買う」を削除して
```

### 高度な使用例

#### 期限付きリマインダーの一括作成

```
> 来週のプロジェクトタスクを「仕事」リストに追加して：
> - 月曜日: 企画書作成
> - 水曜日: レビューミーティング
> - 金曜日: 最終確認
```

#### 特定期間のリマインダー確認

```
> 今日期限のリマインダーをすべて表示して

> 今週中に期限が切れるリマインダーはある？
```

## 🔧 開発

### 開発モードで実行

```bash
npm run dev
```

### テスト実行

```bash
npm test
```

### リント・フォーマット

```bash
npm run lint
npm run format
```

## 📚 利用可能なコマンド

| コマンド             | 説明                             |
| -------------------- | -------------------------------- |
| `get_reminder_lists` | すべてのリマインダーリストを取得 |
| `get_reminders`      | 指定リストのリマインダーを取得   |
| `create_reminder`    | 新しいリマインダーを作成         |
| `complete_reminder`  | リマインダーを完了状態にする     |
| `delete_reminder`    | リマインダーを削除               |
| `search_reminders`   | キーワードでリマインダーを検索   |

## 🔍 トラブルシューティング

### よくある問題

#### 「リマインダーアプリにアクセスできません」エラー

**解決方法**:  
macOSのプライバシー設定でターミナル（またはNode.js）にリマインダーへのアクセス権限を付与してください。

1. システム設定 > プライバシーとセキュリティ > リマインダー
2. 該当アプリのチェックボックスをオンにする

#### 「AppleScript実行エラー」が発生する

**解決方法**:

- リマインダーアプリが起動していることを確認
- 指定したリスト名が正確であることを確認
- 特殊文字を含むリスト名は「"」で囲んで指定

#### Claude Codeでサーバーが認識されない

**解決方法**:

1. 設定ファイルのパスが正しいことを確認
2. Claude Codeを再起動
3. MCPサーバーがビルドされていることを確認（`npm run build`）

### デバッグ方法

#### ログの確認

```bash
# MCPサーバーを直接実行してログを確認
node dist/index.js

# デバッグモードで実行
DEBUG=mcp:* node dist/index.js
```

#### AppleScriptの手動テスト

```bash
# リスト一覧の取得テスト
osascript -e 'tell application "Reminders" to get name of every list'

# 特定リストのリマインダー取得テスト
osascript -e 'tell application "Reminders" to get name of every reminder in list "仕事"'
```

## 🤝 コントリビューション

このプロジェクトはGitHub
Actionsによる自動テストとコード品質チェックが設定されています。

### 開発ワークフロー

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更を実装
4. ローカルでテストを実行
   ```bash
   npm run lint        # コード品質チェック
   npm run build       # ビルド検証
   npm run test        # テスト実行
   npm run test:coverage  # カバレッジチェック
   ```
5. 変更をコミット (`git commit -m 'feat: add amazing feature'`)
6. ブランチにプッシュ (`git push origin feature/amazing-feature`)
7. Pull Requestを作成

### CI/CDパイプライン

すべてのPull Requestは以下のチェックが自動実行されます：

- **コード品質**: ESLintによる静的解析
- **型安全性**: TypeScriptの型チェック
- **テスト**: 単体テストと統合テスト
- **カバレッジ**: 80%以上のテストカバレッジ
- **セキュリティ**: 依存関係の脆弱性チェック
- **フォーマット**: Prettierによるコード整形

これらのチェックをすべて通過する必要があります。

### ブランチ保護ルール

`main`ブランチは保護されており、以下のルールが適用されます：

- Pull Requestによるマージが必須
- 1名以上のレビューが必須
- すべてのステータスチェックが通過している必要がある
- ブランチが最新である必要がある

詳細な設定手順は [.github/BRANCH_PROTECTION.md](./.github/BRANCH_PROTECTION.md)
を参照してください。

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。詳細は
[LICENSE](LICENSE) ファイルを参照してください。

## 🙏 謝辞

- [Model Context Protocol](https://modelcontextprotocol.io/) -
  MCPフレームワークの提供
- [Anthropic Claude Code](https://docs.anthropic.com/en/docs/claude-code) - 開発環境の提供

## 📞 サポート

- 🐛 バグレポート:
  [Issues](https://github.com/atani/mcp-server-macos-reminders/issues)
- 💡 機能要望:
  [Discussions](https://github.com/atani/mcp-server-macos-reminders/discussions)
- 📖 詳細仕様: [CLAUDE.md](./CLAUDE.md)

---

**注意**: このプロジェクトはmacOS専用です。WindowsやLinuxでは動作しません。
