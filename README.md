# UAI - Unified AI Interface

<div align="center">

![UAI Logo](https://img.shields.io/badge/UAI-Unified_AI_Interface-blue?style=for-the-badge)

**🚀 複数のAIツールを統一的に使用できる次世代CLIツール**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

[**インストール**](#-インストール) • [**使い方**](#-使い方) • [**機能**](#-機能) • [**設定**](#-設定) • [**開発**](#-開発)

</div>

---

## 📋 目次

- [概要](#-概要)
- [なぜUAI？](#-なぜuai)
- [機能](#-機能)
- [インストール](#-インストール)
- [クイックスタート](#-クイックスタート)
- [使い方](#-使い方)
  - [Claude Code](#claude-code)
  - [O3 MCP](#o3-mcp)
  - [Gemini CLI](#gemini-cli)
  - [セッション管理](#セッション管理)
- [設定](#-設定)
- [高度な使い方](#-高度な使い方)
- [開発](#-開発)
- [トラブルシューティング](#-トラブルシューティング)
- [貢献](#-貢献)
- [ライセンス](#-ライセンス)

## 🌟 概要

UAI (Unified AI Interface) は、Claude Code、O3 MCP、Gemini CLI などの複数のAIツールを統一的なインターフェースで使用できるCLIツールです。各ツールの長所を活かしながら、シームレスな開発体験を提供します。

### 主な特徴

- 🤖 **Claude Code**: コーディング支援・コード生成・リファクタリング
- 🔍 **O3 MCP**: 最新技術情報の調査・ドキュメント検索
- 🎨 **Gemini CLI**: ビジュアルデザイン・創造的タスク・画像処理
- 📊 **統合セッション管理**: 全ツールの使用履歴を一元管理
- ⚙️ **統一設定**: APIキーや設定を一箇所で管理

## 🤔 なぜUAI？

### 課題

現代の開発では、様々なAIツールを使い分ける必要があります：

- **Claude Code** でコーディング
- **ChatGPT** で技術調査
- **Gemini** でデザイン支援
- **GitHub Copilot** でコード補完

しかし、これらのツールは：
- それぞれ異なるインターフェース
- 個別の設定管理
- セッション履歴の分散
- コンテキストの共有が困難

### 解決策

UAIは以下を提供します：

1. **統一インターフェース**: `uai` コマンドから全ツールにアクセス
2. **セッション共有**: ツール間でコンテキストを共有
3. **統合履歴**: 全ツールの使用履歴を一元管理
4. **スマート提案**: タスクに応じて最適なツールを提案

## ✨ 機能

### 🎯 Claude Code 統合

```bash
# インタラクティブセッション（OAuth認証済みの場合）
uai claude

# ヘッドレスモード（APIキー使用）
uai claude "Reactコンポーネントを作成して"
```

**特徴:**
- ✅ ネイティブCLI自動検出（OAuth認証対応）
- ✅ 完全なインタラクティブセッション
- ✅ ストリーミングレスポンス
- ✅ セッション記録（PTY/パイプモード）
- ✅ プロジェクトコンテキスト認識

### 🔍 O3 MCP 統合

```bash
# 技術情報を調査
uai o3 "React 19の新機能"

# JSON形式で結果取得
uai o3 "Next.js 15 App Router" --format json
```

**特徴:**
- ✅ 最新技術情報の高速検索
- ✅ 構造化された結果
- ✅ 関連トピックの提案
- ✅ 複数フォーマット対応（text/json/markdown）

### 🎨 Gemini CLI 統合

```bash
# テキストベースのタスク
uai gemini "モダンなダッシュボードUIのデザイン"

# 画像入力（実装予定）
uai gemini "この画像を改善して" -i screenshot.png

# 結果をファイルに保存
uai gemini "美しい夕焼けの風景" -o sunset.txt
```

**特徴:**
- ✅ ネイティブGemini CLI対応
- ✅ ビジュアル・創造的タスク
- ✅ YOLOモードで自動実行
- ✅ ファイル出力対応

### 📊 セッション管理

```bash
# セッション一覧
uai sessions --list

# セッション詳細表示
uai sessions --show <session-id>

# セッションクリア
uai sessions --clear
```

**セッション記録内容:**
- 使用したツール
- 実行時刻・所要時間
- 入出力の完全ログ（Claude Code）
- プロジェクトパス

## 📦 インストール

### 前提条件

- Node.js 18以上
- npm または yarn
- Git

### 自動インストール

```bash
# リポジトリをクローン
git clone https://github.com/your-username/uai.git
cd uai

# インストールスクリプトを実行
./install.sh
```

### 手動インストール

```bash
# 依存関係をインストール
npm install

# TypeScriptをビルド
npm run build

# グローバルにリンク
npm link
```

### 確認

```bash
# インストール確認
uai --version

# ヘルプ表示
uai --help
```

## 🚀 クイックスタート

### 1. APIキーの設定

```bash
# Claude Code用（オプション - OAuth使用可能）
uai config --set claude.apiKey=<your-anthropic-api-key>

# Gemini CLI用
uai config --set gemini.apiKey=<your-google-api-key>

# O3 MCP用（オプション）
uai config --set o3.endpoint=<your-endpoint>
uai config --set o3.apiKey=<your-api-key>
```

### 2. 最初のセッション

```bash
# Claude Codeでコーディング開始
uai claude

# 技術調査
uai o3 "最新のWeb開発トレンド"

# デザイン支援
uai gemini "ユーザーフレンドリーなフォームデザイン"
```

## 📖 使い方

### Claude Code

#### インタラクティブセッション

```bash
# 現在のディレクトリでセッション開始
uai claude

# 特定のプロジェクトでセッション開始
uai claude -p /path/to/project
```

**セッション内コマンド:**
- `/help` - ヘルプ表示
- `/status` - 現在の状態確認
- `/init` - CLAUDE.mdファイル作成
- `exit` - セッション終了

#### ヘッドレスモード

```bash
# 単一タスクの実行
uai claude "package.jsonの依存関係を最新版に更新"

# プロジェクトを指定
uai claude "テストを追加" -p ./my-project
```

### O3 MCP

#### 基本検索

```bash
# 技術トピックを検索
uai o3 "Rust async/await"

# 複数キーワード
uai o3 "TypeScript 5.0 decorators metadata"
```

#### 出力フォーマット

```bash
# Markdown形式（デフォルト）
uai o3 "React Server Components"

# JSON形式
uai o3 "Vue 3 Composition API" -f json

# プレーンテキスト
uai o3 "Svelte 5 runes" -f text
```

### Gemini CLI

#### 基本使用

```bash
# クリエイティブタスク
uai gemini "未来的なログイン画面のデザインアイデア"

# 技術的な質問
uai gemini "マイクロサービスアーキテクチャのベストプラクティス"
```

#### モデル指定

```bash
# 特定のモデルを使用
uai gemini "詩を書いて" -m gemini-2.5-pro
```

### セッション管理

#### セッション一覧

```bash
uai sessions --list
```

出力例：
```
📋 セッション一覧:

📅 2025年6月29日(日)
  20:15 🤖 claude-code (15メッセージ) 📁 my-project
  19:30 🔍 o3-mcp (3メッセージ) 📁 research
  18:45 🎨 gemini-cli (5メッセージ) 📁 design
```

#### セッション詳細

```bash
uai sessions --show <session-id>
```

出力例：
```
📊 セッション詳細:
──────────────────────────────────────────────────
ID: 3ee323f8-96d1-48a9-aad9-8cfbf3188d39
ツール: 🤖 claude-code
プロジェクト: /home/user/my-project
開始時刻: 2025/6/29 20:15:00
終了時刻: 2025/6/29 20:45:30
──────────────────────────────────────────────────

📝 会話履歴:
[20:15:05] 👤 User:
Reactコンポーネントを作成して

[20:15:08] 🤖 Assistant:
了解しました。Reactコンポーネントを作成します...
```

## ⚙️ 設定

### 設定ファイルの場所

- **グローバル設定**: `~/.config/uai/config.json`
- **セッション履歴**: `~/.ai-sessions/`

### 設定管理コマンド

```bash
# 全設定を表示
uai config --list

# 特定の設定を取得
uai config --get claude.model

# 設定を変更
uai config --set general.defaultTool=claude

# 設定をリセット
uai config --reset
```

### 環境変数

```bash
# Claude Code
export ANTHROPIC_API_KEY=<your-key>

# Gemini
export GOOGLE_API_KEY=<your-key>
# または
export GEMINI_API_KEY=<your-key>

# O3 MCP
export O3_MCP_ENDPOINT=<your-endpoint>
export O3_MCP_API_KEY=<your-key>
```

### 設定ファイル例

```json
{
  "claude": {
    "apiKey": "sk-ant-...",
    "model": "claude-3-5-sonnet-20241022"
  },
  "gemini": {
    "apiKey": "AI...",
    "model": "gemini-2.5-pro"
  },
  "o3": {
    "endpoint": "https://api.o3mcp.example.com",
    "apiKey": "o3-key-..."
  },
  "general": {
    "defaultTool": "claude",
    "theme": "auto"
  }
}
```

## 🎯 高度な使い方

### ワークフロー統合

#### 1. 開発サイクル

```bash
# 1. アイデア調査
uai o3 "最新のReactパフォーマンス最適化手法"

# 2. 実装
uai claude
> 調査結果を基にパフォーマンス最適化を実装して

# 3. UI改善
uai gemini "より直感的なローディング表示のデザイン"
```

#### 2. コードレビュー支援

```bash
# 変更内容を確認
git diff | uai claude "このコードレビューをして"

# セキュリティチェック
uai claude "セキュリティの観点からコードを確認" -p .
```

#### 3. ドキュメント作成

```bash
# API仕様書生成
uai claude "OpenAPI仕様書を生成" 

# README更新
uai claude "READMEを最新の機能に合わせて更新"
```

### CI/CD統合

#### GitHub Actions

```yaml
name: AI-Assisted Code Review

on: [pull_request]

jobs:
  ai-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup UAI
        run: |
          npm install -g uai
          uai config --set claude.apiKey=${{ secrets.ANTHROPIC_API_KEY }}
      
      - name: AI Code Review
        run: |
          git diff origin/main..HEAD | uai claude "コードレビューして" > review.md
          
      - name: Post Review
        uses: actions/github-script@v6
        with:
          script: |
            const review = fs.readFileSync('review.md', 'utf8');
            github.rest.pulls.createReview({
              ...context.repo,
              pull_number: context.issue.number,
              body: review,
              event: 'COMMENT'
            });
```

### プラグイン開発

UAIは拡張可能な設計になっています：

```typescript
// カスタムプロバイダーの例
import { BaseProvider } from 'uai/providers';

export class CustomAIProvider extends BaseProvider {
  async execute(prompt: string, options: any): Promise<void> {
    // カスタム実装
  }
}
```

## 🧪 開発

### 開発環境のセットアップ

```bash
# リポジトリをクローン
git clone https://github.com/your-username/uai.git
cd uai

# 依存関係をインストール
npm install

# 開発モードで起動
npm run dev
```

### プロジェクト構造

```
uai/
├── src/
│   ├── cli.ts                    # CLIエントリーポイント
│   ├── providers/
│   │   ├── claude-code/          # Claude Code統合
│   │   ├── o3-mcp/              # O3 MCP統合
│   │   └── gemini-cli/          # Gemini CLI統合
│   ├── session/
│   │   └── SessionManager.ts     # セッション管理
│   ├── config/
│   │   └── ConfigManager.ts      # 設定管理
│   └── utils/                    # ユーティリティ
├── tests/                        # テストファイル
├── docs/                         # ドキュメント
├── package.json
├── tsconfig.json
├── lefthook.yml                  # Git hooks設定
└── README.md
```

### ビルドとテスト

```bash
# TypeScriptビルド
npm run build

# テスト実行
npm test

# リント実行
npm run lint

# フォーマット
npm run format

# 型チェック
npm run typecheck
```

### Git Hooks (Lefthook)

プロジェクトではLefthookを使用してコード品質を維持：

```bash
# Lefthookインストール
npm install

# 手動実行
npm run lefthook
```

自動実行されるタスク：
- コミット前：リント、フォーマット、型チェック
- プッシュ前：テスト実行

## 🔧 トラブルシューティング

### よくある問題

#### Claude CLIが見つからない

```bash
# Claude CLIのインストール確認
which claude

# PATHに追加
export PATH="$PATH:~/.local/bin"
```

#### セッション記録が保存されない

```bash
# 権限確認
ls -la ~/.ai-sessions/

# ディレクトリ作成
mkdir -p ~/.ai-sessions
chmod 755 ~/.ai-sessions
```

#### APIキーエラー

```bash
# 設定確認
uai config --list

# 環境変数確認
echo $ANTHROPIC_API_KEY
```

### デバッグモード

```bash
# デバッグ情報を表示
DEBUG=uai:* uai claude

# 詳細ログ
UAI_LOG_LEVEL=debug uai o3 "test"
```

### パフォーマンス問題

1. **セッション履歴が大きすぎる場合**
   ```bash
   # 古いセッションを削除
   uai sessions --clear
   ```

2. **キャッシュクリア**
   ```bash
   rm -rf ~/.cache/uai
   ```

## 🤝 貢献

プロジェクトへの貢献を歓迎します！

### 貢献方法

1. **Issue報告**
   - バグ報告
   - 機能リクエスト
   - ドキュメント改善提案

2. **プルリクエスト**
   ```bash
   # フォーク & クローン
   git clone https://github.com/your-username/uai.git
   
   # ブランチ作成
   git checkout -b feature/amazing-feature
   
   # 変更をコミット
   git commit -m 'feat: Add amazing feature'
   
   # プッシュ
   git push origin feature/amazing-feature
   ```

### 開発ガイドライン

- **コーディング規約**: [CONTRIBUTING.md](CONTRIBUTING.md)を参照
- **コミットメッセージ**: [Conventional Commits](https://www.conventionalcommits.org/)に従う
- **テスト**: 新機能には必ずテストを追加
- **ドキュメント**: APIの変更時は必ずドキュメントを更新

### コミットメッセージ形式

```
<type>(<scope>): <subject>

<body>

<footer>
```

タイプ:
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント
- `style`: フォーマット
- `refactor`: リファクタリング
- `test`: テスト
- `chore`: その他

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は[LICENSE](LICENSE)ファイルを参照してください。

## 🙏 謝辞

UAIは以下のプロジェクトに依存し、インスピレーションを受けています：

- [Claude Code](https://claude.ai/code) by Anthropic
- [Gemini CLI](https://github.com/google/gemini-cli) by Google
- [Commander.js](https://github.com/tj/commander.js) - CLIフレームワーク
- [Chalk](https://github.com/chalk/chalk) - ターミナル出力スタイリング
- [node-pty](https://github.com/microsoft/node-pty) - 擬似端末サポート

## 📞 サポート

- **ドキュメント**: [Wiki](https://github.com/your-username/uai/wiki)
- **質問**: [Discussions](https://github.com/your-username/uai/discussions)
- **バグ報告**: [Issues](https://github.com/your-username/uai/issues)
- **セキュリティ**: security@example.com

---

<div align="center">

**Made with ❤️ by the UAI Team**

[⬆ トップに戻る](#uai---unified-ai-interface)

</div>