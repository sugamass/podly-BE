# Podly Lambda Functions

Terraform でデプロイするための lambda 関数群

## プロジェクト構成

```
podly-lambda/
├── package.json                    # ルートプロジェクト設定
├── tsconfig.json                   # 共通TypeScript設定
├── functions/                      # 各Lambda関数
│   └── createScript/              # createScript Lambda関数
├── shared/                        # 共通ライブラリ
└── scripts/                       # ビルド・デプロイスクリプト
```

## セットアップ

### 1. 依存関係のインストール

```bash
# ルートディレクトリで
npm install

# 共通ライブラリ
cd shared && npm install && cd ..

# createScript関数
cd functions/createScript && npm install && cd ../..
```

### 2. 環境変数の設定

```bash
# .envファイルを作成（ローカル開発用）
cp .env.example .env

# 必要な環境変数を設定
OPENAI_API_KEY=your_openai_api_key
TAVILY_API_KEY=your_tavily_api_key
```

## ビルド

### 全関数をビルド

```bash
npm run build
# または
./scripts/build.sh
```

### 単一関数をビルド

```bash
npm run build:createScript
# または
./scripts/build-function.sh createScript
```

## デプロイ用パッケージ

ビルド後、`dist/`ディレクトリに以下のファイルが生成されます：

- `createScript.zip` - createScript Lambda 関数

これらの Zip ファイルを Terraform から参照してデプロイします。

## 関数の詳細

### createScript

- **目的**: OpenAI API を使用してポッドキャスト台本を生成
- **Handler**: `src/handlers/script.createScript`
- **HTTP API**: `POST /script/create`
- **環境変数**:
  - `OPENAI_API_KEY`: OpenAI API キー
  - `TAVILY_API_KEY`: Tavily API キー（検索機能用）
  - `NODE_ENV`: 環境名
  - `STAGE`: ステージ名

## アーキテクチャ

### Clean Architecture 採用

- **Handler 層**: Lambda 関数のエントリーポイント
- **Application 層**: ユースケース・ビジネスロジック
- **Domain 層**: ドメインエンティティ・ビジネスルール
- **Infrastructure 層**: 外部サービス連携（OpenAI API 等）

### 共通ライブラリ

複数の Lambda 関数で共有される機能：

- 型定義
- ドメインエンティティ
- ユーティリティ関数
- OpenAI エージェント
- レスポンスヘルパー

## 開発

### 型チェック

```bash
npm run lint
```

### クリーンアップ

```bash
npm run clean
```
