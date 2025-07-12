#!/bin/bash

set -e

# 関数名のマッピング関数
get_function_dir() {
    case "$1" in
        "createScript") echo "createScript" ;;
        "previewAudio") echo "createPreviewAudio" ;;
        *) echo "" ;;
    esac
}

# 引数チェック
if [ $# -eq 0 ]; then
    echo "❌ Usage: $0 <function-name>"
    echo "Available functions: createScript, previewAudio"
    exit 1
fi

FUNCTION_ARG=$1
FUNCTION_DIR=$(get_function_dir "$FUNCTION_ARG")

# 関数名の検証
if [ -z "$FUNCTION_DIR" ]; then
    echo "❌ Unknown function: $FUNCTION_ARG"
    echo "Available functions: createScript, previewAudio"
    exit 1
fi

echo "🔨 Building Lambda function: $FUNCTION_ARG ($FUNCTION_DIR)"
echo "================================================"

# プロジェクトルートに移動
cd "$(dirname "$0")/.."

# sharedライブラリのビルド
echo "📦 Building shared library..."
cd shared
npm install
npm run build
cd ..

# 関数ディレクトリの存在確認
if [ ! -d "functions/$FUNCTION_DIR" ]; then
    echo "❌ Function directory not found: functions/$FUNCTION_DIR"
    exit 1
fi

# 関数のビルド
echo "📦 Building function: $FUNCTION_DIR..."
cd "functions/$FUNCTION_DIR"

# 依存関係のインストール
npm install

# ビルド実行
npm run build

# プロジェクトルートに戻る
cd ../..

# distディレクトリの作成
mkdir -p dist

# zipファイル名の決定（kebab-case）
case "$FUNCTION_ARG" in
    "createScript") ZIP_NAME="create-script" ;;
    "previewAudio") ZIP_NAME="create-preview-audio" ;;
    *) ZIP_NAME="$FUNCTION_ARG" ;;
esac
ZIP_PATH="dist/${ZIP_NAME}.zip"

# 古いzipファイルの削除
if [ -f "$ZIP_PATH" ]; then
    rm "$ZIP_PATH"
fi

# zipファイルの作成
echo "📦 Creating deployment package: $ZIP_PATH"
cd "functions/$FUNCTION_DIR/dist"
zip -r "../../../$ZIP_PATH" . -x "*.map" "*.ts"
cd ../../..

echo "✅ Successfully built $FUNCTION_ARG -> $ZIP_PATH" 