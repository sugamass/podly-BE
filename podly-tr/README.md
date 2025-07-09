# Podly Lambda Infrastructure

この Terraform プロジェクトは、Podly の Lambda 関数を AWS にデプロイするためのインフラストラクチャです。

## 📋 デプロイされるリソース

### Lambda Functions

- **podly-dev-createScript** - スクリプト生成 API
- **podly-dev-createPreviewAudio** - 音声プレビュー API

### API Gateway

- **HTTP API** - RESTful API エンドポイント
  - `POST /script/create`
  - `POST /audio/preview`

### その他のリソース

- IAM ロール（Lambda 実行用）
- CloudWatch Logs
- Lambda Layer（FFmpeg 用）

## 🚀 デプロイ手順

### 1. 前提条件

- AWS CLI がインストール・設定済み
- Terraform >= 1.0 がインストール済み
- Node.js 18.x がインストール済み

### 2. Lambda 関数のビルド

```bash
cd ../podly-lambda
npm install
npm run build
```

### 3. 環境変数の設定

`terraform.tfvars` ファイルを作成：

```bash
cp terraform.tfvars.example terraform.tfvars
```

`terraform.tfvars` を編集して以下を設定：

```hcl
# API Keys
openai_api_key = "your-openai-api-key"
tavily_api_key = "your-tavily-api-key"

# Lambda Packages (ビルド後に自動生成される想定)
lambda_packages = {
  create_script = {
    filename         = "../podly-lambda/dist/create-script.zip"
    source_code_hash = "ハッシュ値"
  }
  create_preview_audio = {
    filename         = "../podly-lambda/dist/create-preview-audio.zip"
    source_code_hash = "ハッシュ値"
  }
}
```

### 4. FFmpeg Layer の準備

```bash
# FFmpeg Layer用のZIPファイルをダウンロードまたは作成
# 例: 公開されているLayerを使用する場合
wget https://github.com/serverless/serverless/releases/download/v3.0.0/ffmpeg-layer.zip
```

### 5. Terraform の実行

```bash
# 初期化
terraform init

# プランの確認
terraform plan

# デプロイ
terraform apply
```

## 📁 ディレクトリ構造

```
podly-tr/
├── main.tf                    # メインリソース定義
├── variables.tf               # 変数定義
├── outputs.tf                 # 出力値
├── terraform.tfvars.example   # 環境変数サンプル
├── terraform.tfvars          # 環境変数（Git管理対象外）
└── modules/
    ├── iam/                  # IAMロール・ポリシー
    ├── lambda/               # Lambda関数
    └── api-gateway/          # API Gateway
```

## 🔧 環境変数

### 必須環境変数

- `OPENAI_API_KEY` - OpenAI API キー
- `TAVILY_API_KEY` - Tavily API キー

### Lambda 関数の環境変数

- `NODE_ENV` - 環境名（dev）
- `STAGE` - ステージ名（dev）
- `FFMPEG_PATH` - FFmpeg バイナリパス（/opt/bin/ffmpeg）
- `FFPROBE_PATH` - FFprobe バイナリパス（/opt/bin/ffprobe）

## 📝 デプロイ後の確認

```bash
# 出力されたエンドポイントを確認
terraform output

# 例: APIテスト
curl -X POST \
  https://your-api-id.execute-api.ap-northeast-1.amazonaws.com/script/create \
  -H 'Content-Type: application/json' \
  -d '{"prompt": "テスト用のスクリプトを生成してください"}'
```

## 🛡️ セキュリティ考慮事項

1. **API Keys**: 本番環境では AWS Secrets Manager の使用を推奨
2. **CORS**: 必要に応じて `cors_allow_origins` を制限
3. **IAM**: 最小権限の原則に従った権限設定

## 🔄 更新・削除

### コードの更新

```bash
# Lambda関数の更新
cd ../podly-lambda
npm run build

# Terraform適用
cd ../podly-tr
terraform apply
```

### インフラの削除

```bash
terraform destroy
```

## ❗ 注意事項

1. **FFmpeg Layer**: 初回デプロイ時に `ffmpeg-layer.zip` が必要
2. **Lambda Package**: ビルド済みの ZIP ファイルが必要
3. **API Keys**: 環境変数として安全に管理してください
