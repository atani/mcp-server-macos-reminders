# macOS Reminders MCP Server 設計書

## プロジェクト概要

### 目的

macOSの標準リマインダーアプリを操作するMCP (Model Context
Protocol) サーバーを開発し、Claude Codeから直接リマインダーの管理を可能にする。

### 技術スタック

- **言語**: TypeScript/Node.js
- **MCPフレームワーク**: @modelcontextprotocol/sdk
- **OS統合**: AppleScript (osascript コマンド)
- **対象プラットフォーム**: macOS

## MCP Server 仕様

### Tools 定義

#### 1. get_reminder_lists

すべてのリマインダーリストを取得する

```typescript
interface GetReminderListsResult {
  lists: Array<{
    name: string;
    id: string;
  }>;
}
```

**AppleScript実装**:

```applescript
tell application "Reminders"
  get name of every list
end tell
```

#### 2. get_reminders

指定されたリストのリマインダーを取得する

```typescript
interface GetRemindersParams {
  list_name: string;
  completed?: boolean; // true: 完了済み, false: 未完了, undefined: すべて
}

interface GetRemindersResult {
  reminders: Array<{
    name: string;
    id: string;
    completed: boolean;
    notes?: string;
    due_date?: string; // ISO 8601 format
    creation_date: string; // ISO 8601 format
  }>;
}
```

**AppleScript実装**:

```applescript
tell application "Reminders"
  set reminderList to list "リスト名"
  set allReminders to every reminder in reminderList
  repeat with reminderItem in allReminders
    set reminderName to name of reminderItem
    set isCompleted to completed of reminderItem
    set reminderNotes to body of reminderItem
    set dueDate to due date of reminderItem
    set creationDate to creation date of reminderItem
  end repeat
end tell
```

#### 3. create_reminder

新しいリマインダーを作成する

```typescript
interface CreateReminderParams {
  list_name: string;
  name: string;
  notes?: string;
  due_date?: string; // ISO 8601 format
  priority?: 'none' | 'low' | 'medium' | 'high';
}

interface CreateReminderResult {
  success: boolean;
  reminder_id?: string;
  error?: string;
}
```

**AppleScript実装**:

```applescript
tell application "Reminders"
  set reminderList to list "リスト名"
  set newReminder to make new reminder at end of reminderList
  set name of newReminder to "リマインダー名"
  if notes is not "" then set body of newReminder to notes
  if due_date is not "" then set due date of newReminder to date due_date
  if priority is not "none" then set priority of newReminder to priority
end tell
```

#### 4. complete_reminder

リマインダーを完了状態にする

```typescript
interface CompleteReminderParams {
  list_name: string;
  reminder_name: string;
}

interface CompleteReminderResult {
  success: boolean;
  error?: string;
}
```

**AppleScript実装**:

```applescript
tell application "Reminders"
  set reminderList to list "リスト名"
  set targetReminder to first reminder in reminderList whose name is "リマインダー名"
  set completed of targetReminder to true
end tell
```

#### 5. delete_reminder

リマインダーを削除する

```typescript
interface DeleteReminderParams {
  list_name: string;
  reminder_name: string;
}

interface DeleteReminderResult {
  success: boolean;
  error?: string;
}
```

**AppleScript実装**:

```applescript
tell application "Reminders"
  set reminderList to list "リスト名"
  set targetReminder to first reminder in reminderList whose name is "リマインダー名"
  delete targetReminder
end tell
```

#### 6. search_reminders

キーワードでリマインダーを検索する

```typescript
interface SearchRemindersParams {
  query: string;
  list_name?: string; // 指定されない場合は全リストを検索
  completed?: boolean;
}

interface SearchRemindersResult {
  reminders: Array<{
    name: string;
    id: string;
    list_name: string;
    completed: boolean;
    notes?: string;
    due_date?: string;
    creation_date: string;
  }>;
}
```

**AppleScript実装**:

```applescript
tell application "Reminders"
  if list_name is specified then
    set searchLists to {list list_name}
  else
    set searchLists to every list
  end if

  set foundReminders to {}
  repeat with currentList in searchLists
    set reminders to every reminder in currentList
    repeat with reminderItem in reminders
      if name of reminderItem contains query then
        set end of foundReminders to reminderItem
      end if
    end repeat
  end repeat
end tell
```

### Resources 定義

#### 1. reminders://lists

すべてのリマインダーリスト情報を提供

```typescript
interface RemindersListsResource {
  uri: 'reminders://lists';
  mimeType: 'application/json';
  content: {
    lists: Array<{
      name: string;
      id: string;
      reminder_count: number;
      completed_count: number;
    }>;
  };
}
```

#### 2. reminders://list/{list_name}

特定リストの詳細情報を提供

```typescript
interface ReminderListResource {
  uri: `reminders://list/${string}`;
  mimeType: 'application/json';
  content: {
    list: {
      name: string;
      id: string;
      reminders: Array<{
        name: string;
        id: string;
        completed: boolean;
        notes?: string;
        due_date?: string;
        creation_date: string;
      }>;
    };
  };
}
```

## 実装詳細

### プロジェクト構造

```
mcp-reminder-claude/
├── src/
│   ├── index.ts           # MCPサーバーのエントリーポイント
│   ├── applescript/       # AppleScript実行ユーティリティ
│   │   ├── executor.ts
│   │   └── scripts.ts
│   ├── tools/             # MCP Tools実装
│   │   ├── get-lists.ts
│   │   ├── get-reminders.ts
│   │   ├── create-reminder.ts
│   │   ├── complete-reminder.ts
│   │   ├── delete-reminder.ts
│   │   └── search-reminders.ts
│   ├── resources/         # MCP Resources実装
│   │   ├── lists.ts
│   │   └── list-detail.ts
│   └── types.ts           # 型定義
├── package.json
├── tsconfig.json
└── CLAUDE.md
```

### AppleScript実行エンジン

```typescript
// src/applescript/executor.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class AppleScriptExecutor {
  async execute(script: string): Promise<string> {
    try {
      const { stdout, stderr } = await execAsync(
        `osascript -e '${script.replace(/'/g, "\\'")}'`
      );
      if (stderr) {
        throw new Error(`AppleScript error: ${stderr}`);
      }
      return stdout.trim();
    } catch (error) {
      throw new Error(`Failed to execute AppleScript: ${error.message}`);
    }
  }

  async executeFile(scriptPath: string): Promise<string> {
    try {
      const { stdout, stderr } = await execAsync(`osascript ${scriptPath}`);
      if (stderr) {
        throw new Error(`AppleScript error: ${stderr}`);
      }
      return stdout.trim();
    } catch (error) {
      throw new Error(`Failed to execute AppleScript file: ${error.message}`);
    }
  }
}
```

### エラーハンドリング仕様

#### エラーコード体系

- `REMINDERS_APP_NOT_FOUND`: リマインダーアプリが見つからない
- `PERMISSION_DENIED`: プライバシー設定でアクセスが拒否されている
- `LIST_NOT_FOUND`: 指定されたリストが存在しない
- `REMINDER_NOT_FOUND`: 指定されたリマインダーが存在しない
- `INVALID_DATE_FORMAT`: 日付フォーマットが不正
- `APPLESCRIPT_ERROR`: AppleScript実行エラー

#### エラーレスポンス形式

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
```

### セキュリティ考慮事項

#### 権限管理

1. **システム設定での許可**: ターミナル（またはNode.js）がリマインダーにアクセスする権限
2. **AppleScript実行権限**: osascriptコマンドの実行権限
3. **入力値検証**: SQLインジェクション的な攻撃の防止

#### 入力サニタイゼーション

```typescript
export function sanitizeAppleScriptString(input: string): string {
  return input
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}
```

## 使用例

### Claude Codeでの使用例

#### リマインダー一覧取得

```
> リマインダーのリスト一覧を表示して

MCPサーバーを使用してリマインダーリストを取得します...

利用可能なリスト:
- 仕事 (152件)
- Family (8件)
- 定期的 (12件)
- 買うもの (3件)
- Study (15件)
```

#### 新しいリマインダー作成

```
> 「仕事」リストに「プレゼン資料作成」のリマインダーを明日の15時期限で追加して

リマインダーを作成しました:
- リスト: 仕事
- タイトル: プレゼン資料作成
- 期限: 2025-07-27 15:00
```

#### リマインダー検索

```
> 「動画」に関するリマインダーを検索して

「動画」に関するリマインダー (15件):
- MLAJ動画編集 (仕事)
- むーたん動画No5チェック (仕事)
- 動画制作 CTA (仕事)
...
```

## テスト仕様

### テスト戦略とプラットフォーム対応

#### クロスプラットフォーム対応の原則
本プロジェクトはmacOS専用だが、開発・CI/CD環境では複数プラットフォームでの動作が必要。以下の戦略でプラットフォーム依存の問題を解決：

##### 1. テスト分類
- **単体テスト** (`tests/unit/`): 全プラットフォームで実行可能
- **クロスプラットフォーム統合テスト** (`tests/integration/cross-platform-safe.test.ts`): プラットフォーム非依存
- **macOS専用統合テスト** (`tests/integration/applescript-integration.test.ts`): macOS + 権限必要

##### 2. 実行環境による分岐
```typescript
// プラットフォーム検出
const isMacOS = process.platform === 'darwin';
const isCI = process.env.CI === 'true';
const runIntegrationTests = process.env.RUN_INTEGRATION_TESTS === 'true';
const shouldRunTests = isMacOS && runIntegrationTests && !isCI;

// 条件付きテスト実行
function itOnMacOS(description: string, testFn: () => Promise<void>, timeout = 30000) {
  if (shouldRunTests) {
    it(description, testFn, timeout);
  } else {
    it.skip(`[SKIPPED - ${!isMacOS ? 'Non-macOS' : isCI ? 'CI' : 'Integration disabled'}] ${description}`, testFn);
  }
}
```

##### 3. CI/CD環境での実行制御
- **Ubuntu CI**: 単体テスト + クロスプラットフォーム統合テスト
- **macOS CI**: 基本テストのみ（権限制限のため）
- **ローカル開発**: 全テスト実行可能（環境変数で制御）

### 単体テスト
- AppleScript実行エンジンのテスト（モック使用）
- 各Tool関数の正常系・異常系テスト
- 入力値バリデーションのテスト
- 文字列サニタイゼーションのテスト

### クロスプラットフォーム統合テスト
- パラメータバリデーション
- エラーハンドリング
- セキュリティサニタイゼーション
- 非macOS環境でのエラー処理

### macOS専用統合テスト
- 実際のAppleScript実行
- リマインダーアプリとの連携
- 権限エラーの処理
- CRUD操作の完全テスト

### テストコマンド
```bash
# 基本テスト（全プラットフォーム対応）
npm test                    # 単体テスト + クロスプラットフォーム統合テスト
npm run test:unit          # 単体テストのみ
npm run test:coverage      # カバレッジ付きテスト

# macOS専用テスト（ローカル開発用）
RUN_INTEGRATION_TESTS=true npm run test:integration    # macOS統合テスト
TEST_REMINDER_CRUD=true npm run test:integration       # データ変更テスト含む

# CI用テスト
npm run test:unit          # CI環境で実行
npm run test:integration   # macOS以外ではスキップ
```

### プラットフォーム対応ガイドライン
1. **新機能開発時**:
   - 必ず単体テストを追加（全プラットフォーム対応）
   - クロスプラットフォーム統合テストでバリデーション確認
   - macOS専用機能はmacOS専用統合テストに追加

2. **CI/CD失敗時の対処**:
   - プラットフォーム固有エラーは条件分岐で回避
   - 環境変数による実行制御を活用
   - テストスキップ理由を明確に表示

3. **ローカル開発**:
   - macOS: 全テスト実行可能
   - 非macOS: 単体テスト + クロスプラットフォーム統合テストのみ

## 開発・デプロイ手順

### 開発環境セットアップ

```bash
npm install
npm run build
npm run dev
```

### 本番ビルド

```bash
npm run build
npm start
```

### Claude Code設定

```json
{
  "mcpServers": {
    "reminders": {
      "command": "node",
      "args": ["/path/to/mcp-reminder-claude/dist/index.js"],
      "env": {}
    }
  }
}
```
