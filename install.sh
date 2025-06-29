#!/bin/bash
# UAI (Unified AI Interface) インストールスクリプト

set -e

echo "🚀 UAI (Unified AI Interface) インストール開始..."
echo ""

# 現在のディレクトリを取得
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Node.jsの確認
if ! command -v node &> /dev/null; then
    echo "❌ エラー: Node.js がインストールされていません"
    echo "   Node.js 18以上をインストールしてください"
    exit 1
fi

# Node.jsバージョンチェック
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ エラー: Node.js 18以上が必要です (現在: v$NODE_VERSION)"
    exit 1
fi

# npmインストール
echo "📦 依存関係をインストール中..."
npm install

# TypeScriptビルド
echo "🔨 TypeScript をビルド中..."
npm run build

# グローバルインストール
echo "🌍 グローバルにインストール中..."
npm link

# ディレクトリ作成
echo "📁 必要なディレクトリを作成中..."
mkdir -p "$HOME/.ai-sessions"
mkdir -p "$HOME/.config/uai"

# インストール確認
if command -v uai &> /dev/null; then
    echo ""
    echo "✅ UAI が正常にインストールされました！"
    echo ""
    echo "🎯 使い方:"
    echo "  # Claude Code インタラクティブセッション"
    echo "  uai claude"
    echo ""
    echo "  # O3 MCP で技術調査"
    echo "  uai o3 \"React 19の新機能\""
    echo ""
    echo "  # Gemini CLI でビジュアルタスク"
    echo "  uai gemini \"美しい夕焼けの風景\""
    echo ""
    echo "⚙️  設定:"
    echo "  # APIキーを設定"
    echo "  uai config --set claude.apiKey=<your-key>"
    echo "  uai config --set gemini.apiKey=<your-key>"
    echo ""
    echo "📚 詳細は README.md を参照してください"
else
    echo "❌ インストールに失敗しました"
    exit 1
fi