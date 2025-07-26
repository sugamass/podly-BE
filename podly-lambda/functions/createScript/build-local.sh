#!/bin/bash

set -e

echo "🔨 Building createScript (local development)"
echo "============================================"

# 現在のディレクトリを保存
CURRENT_DIR=$(pwd)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "📍 Script directory: $SCRIPT_DIR"
echo "📍 Project root: $PROJECT_ROOT"

# プロジェクトルートに移動してsharedライブラリをビルド
echo "📦 Building shared library..."
cd "$PROJECT_ROOT/shared"
npm install
npm run build

# createScriptディレクトリに戻る
cd "$SCRIPT_DIR"

# 依存関係のインストール（必要に応じて）
if [ ! -d "node_modules" ]; then
    echo "🔧 Installing dependencies..."
    npm install
fi

# 古いdistディレクトリをクリーン
echo "🧹 Cleaning old build..."
npm run clean

# ビルド実行
echo "⚡ Running webpack build..."
webpack --mode development

# 元のディレクトリに戻る
cd "$CURRENT_DIR"

echo "✅ Local build completed!"
echo "📂 Output: $SCRIPT_DIR/dist/"
echo "🚀 Ready for local testing" 