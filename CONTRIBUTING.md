# UAI プロジェクトへの貢献ガイド

UAI プロジェクトへの貢献を検討いただき、ありがとうございます！

## 行動規範

このプロジェクトに参加するすべての人は、お互いを尊重し、建設的な環境を維持することが期待されています。

## 貢献の方法

### 1. Issue の報告

#### バグ報告

バグを見つけた場合は、以下の情報を含めて Issue を作成してください：

- UAI のバージョン（`uai --version`）
- Node.js のバージョン（`node --version`）
- OS とバージョン
- 再現手順
- 期待される動作
- 実際の動作
- エラーメッセージ（ある場合）

#### 機能リクエスト

新機能の提案は大歓迎です！以下を含めてください：

- 機能の説明
- ユースケース
- 実装のアイデア（オプション）

### 2. プルリクエスト

#### 準備

1. リポジトリをフォーク
2. ローカルにクローン
3. 開発用ブランチを作成

```bash
git clone https://github.com/your-username/uai.git
cd uai
git checkout -b feature/your-feature-name
```

#### 開発

1. 依存関係をインストール

```bash
npm install
```

2. 開発環境を起動

```bash
npm run watch  # TypeScript のウォッチモード
npm run dev    # CLI の実行
```

3. コードを書く

- TypeScript で記述
- 既存のコーディング規約に従う
- 適切なコメントを追加

4. テストを追加（該当する場合）

```bash
npm test
```

5. リント・フォーマット

```bash
npm run fix:all  # 自動修正
npm run check:all  # チェックのみ
```

#### コミット

コミットメッセージは [Conventional Commits](https://www.conventionalcommits.org/) に従ってください：

```bash
# 新機能
git commit -m "feat(claude): add streaming response support"

# バグ修正
git commit -m "fix(session): resolve memory leak in session manager"

# ドキュメント
git commit -m "docs: update installation guide"

# リファクタリング
git commit -m "refactor(providers): simplify provider interface"
```

#### プルリクエストの作成

1. 変更をプッシュ

```bash
git push origin feature/your-feature-name
```

2. GitHub でプルリクエストを作成
3. PR テンプレートに従って記入
4. レビューを待つ

### 3. コーディング規約

#### TypeScript

- 厳密な型付けを使用
- `any` 型は避ける
- インターフェースを適切に定義
- エラーハンドリングを適切に行う

```typescript
// Good
interface UserInput {
  prompt: string;
  options?: {
    model?: string;
    temperature?: number;
  };
}

async function processInput(input: UserInput): Promise<void> {
  try {
    // 処理
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error:', error.message);
    }
    throw error;
  }
}

// Bad
async function processInput(input: any) {
  // 処理
}
```

#### ファイル構造

```
src/
├── providers/          # AI プロバイダー
│   ├── base/          # 基底クラス
│   └── {provider}/    # 各プロバイダー
├── session/           # セッション管理
├── config/            # 設定管理
├── utils/             # ユーティリティ
└── types/             # 型定義
```

#### 命名規則

- クラス: PascalCase
- インターフェース: PascalCase（I プレフィックスなし）
- 関数・変数: camelCase
- 定数: UPPER_SNAKE_CASE
- ファイル: kebab-case（TypeScript ファイルは例外）

### 4. テスト

#### 単体テスト

```typescript
describe('SessionManager', () => {
  it('should create a new session', async () => {
    const manager = new SessionManager('/tmp/test');
    const sessionId = await manager.createSession('test-tool', '/tmp');
    expect(sessionId).toBeDefined();
  });
});
```

#### 統合テスト

実際の AI サービスとの統合テストは、環境変数でスキップ可能にする：

```typescript
describe.skipIf(!process.env.ANTHROPIC_API_KEY)('Claude Integration', () => {
  // テスト
});
```

### 5. ドキュメント

#### コード内ドキュメント

JSDoc を使用してください：

```typescript
/**
 * セッションを作成します
 * @param tool - 使用するツール名
 * @param projectPath - プロジェクトのパス
 * @returns セッション ID
 */
async createSession(tool: string, projectPath: string): Promise<string> {
  // 実装
}
```

#### README の更新

新機能を追加した場合は、README.md も更新してください。

### 6. リリースプロセス

1. `develop` ブランチで開発
2. `main` ブランチへの PR を作成
3. レビューと承認
4. マージ後、タグを作成してリリース

### 7. 質問とサポート

- **質問**: [Discussions](https://github.com/your-username/uai/discussions) で質問
- **リアルタイムチャット**: Discord/Slack（将来的に）
- **メール**: maintainer@example.com

## ライセンス

貢献されたコードは、プロジェクトと同じ MIT ライセンスの下でリリースされます。

## 謝辞

貢献者の皆様に感謝します！あなたの貢献がこのプロジェクトをより良いものにします。

---

Happy Coding! 🚀