#!/bin/bash

set -e

echo "🚀 Podly Lambda Build & Deploy Script"
echo "======================================"

# カレントディレクトリの確認
if [ ! -f "main.tf" ]; then
    echo "❌ main.tf not found. Please run this script from podly-tr directory."
    exit 1
fi

# Lambda関数のビルド
echo "📦 Building Lambda functions..."
cd ../podly-lambda

# 依存関係のインストール
npm install

# ビルド実行
npm run build

echo "✅ Lambda functions built successfully"

# Terraformディレクトリに戻る
cd ../podly-tr

# terraform.tfvarsの存在確認
if [ ! -f "terraform.tfvars" ]; then
    echo "❌ terraform.tfvars not found. Please create it from terraform.tfvars.example"
    exit 1
fi

# FFmpeg Layerの確認
if [ ! -f "ffmpeg-layer.zip" ]; then
    echo "⚠️  ffmpeg-layer.zip not found. Downloading..."
    # 例: 公開されているLayerをダウンロード（実際のURLに置き換える）
    echo "Please manually download or create ffmpeg-layer.zip for your region"
    echo "You can use: https://github.com/serverlessrepo/serverlessrepo-ffmpeg-layer"
    exit 1
fi

# Terraform初期化（必要な場合のみ）
if [ ! -d ".terraform" ]; then
    echo "🔧 Initializing Terraform..."
    terraform init
fi

# Terraform plan
echo "📋 Running Terraform plan..."
terraform plan

# デプロイ確認
echo ""
read -p "🚀 Do you want to deploy? (y/N): " confirm
if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
    echo "🚀 Deploying infrastructure..."
    terraform apply -auto-approve
    
    echo ""
    echo "✅ Deployment completed!"
    echo ""
    echo "📊 Outputs:"
    terraform output
else
    echo "❌ Deployment cancelled"
fi 