#!/bin/bash

set -e

echo "🚀 Building All Podly Lambda Functions"
echo "======================================"

# プロジェクトルートに移動
cd "$(dirname "$0")/.."

# 利用可能な関数のリスト
FUNCTIONS=("createScript" "previewAudio")

# 古いビルド成果物をクリーンアップ
echo "🧹 Cleaning previous builds..."
npm run clean

# ルート依存関係のインストール
echo "📦 Installing root dependencies..."
npm install

# 各関数をビルド
for FUNCTION in "${FUNCTIONS[@]}"; do
    echo ""
    echo "🔨 Building function: $FUNCTION"
    echo "================================"
    ./scripts/build-function.sh "$FUNCTION"
done

echo ""
echo "🎉 All Lambda functions built successfully!"
echo ""
echo "📦 Generated packages:"
ls -la dist/*.zip

echo ""
echo "📋 Build summary:"
echo "✅ createScript -> dist/create-script.zip"
echo "✅ previewAudio -> dist/preview-audio.zip"
echo ""
echo "🚀 Ready for Terraform deployment!" 