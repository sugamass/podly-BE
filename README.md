# Pods Backend

AIポッドキャストプラットフォームのバックエンドAPI

## 技術スタック

- **Runtime**: Node.js 18+
- **Framework**: Serverless Framework
- **Language**: TypeScript
- **Cloud**: AWS Lambda + API Gateway
- **Database**: DynamoDB
- **Storage**: S3
- **Authentication**: AWS Cognito

## プロジェクト構成

```
backend/
├── src/
│   ├── types/          # 型定義
│   ├── constants/      # 定数
│   ├── utils/          # ユーティリティ
│   ├── handlers/       # Lambda関数ハンドラー
│   ├── middleware/     # ミドルウェア
│   ├── services/       # ビジネスロジック
│   └── repositories/   # データアクセス層
├── serverless.yml      # Serverless設定
├── tsconfig.json       # TypeScript設定
├── webpack.config.js   # Webpack設定
└── package.json        # 依存関係
```

## 開発環境セットアップ

### 前提条件
- Node.js >= 18.0.0
- npm >= 9.0.0
- AWS CLI設定済み
- Serverless Framework CLI

### インストール

```bash
# 依存関係のインストール
npm install

# Serverless Framework CLI（グローバル）
npm install -g serverless
```

### 環境変数設定

AWS Systems Manager Parameter Storeに以下のパラメータを設定：

```bash
# JWT秘密鍵
aws ssm put-parameter --name "/pods/dev/jwt-secret" --value "your-jwt-secret" --type "SecureString"

# OpenAI API Key
aws ssm put-parameter --name "/pods/dev/openai-api-key" --value "your-openai-key" --type "SecureString"

# TTS API Key
aws ssm put-parameter --name "/pods/dev/tts-api-key" --value "your-tts-key" --type "SecureString"
```

## 開発

```bash
# ローカル開発サーバー起動
npm run dev

# TypeScriptビルド
npm run build

# リント
npm run lint

# テスト
npm run test
```

## デプロイ

```bash
# 開発環境
npm run deploy:dev

# ステージング環境
npm run deploy:staging

# 本番環境
npm run deploy:prod
```

## API エンドポイント

### 認証
- `POST /auth/login` - ログイン
- `POST /auth/register` - ユーザー登録
- `POST /auth/refresh` - トークンリフレッシュ

### ユーザー
- `GET /users/profile` - プロフィール取得
- `PUT /users/profile` - プロフィール更新
- `POST /users/follow` - フォロー

### ポッドキャスト
- `GET /podcasts` - ポッドキャスト一覧
- `GET /podcasts/{id}` - ポッドキャスト詳細
- `POST /podcasts` - ポッドキャスト作成
- `PUT /podcasts/{id}` - ポッドキャスト更新
- `DELETE /podcasts/{id}` - ポッドキャスト削除

### 生成
- `POST /generation/script` - 原稿生成
- `POST /generation/audio` - 音声生成
- `POST /generation/podcast` - ポッドキャスト全体生成
- `GET /generation/jobs/{id}` - 生成ジョブ状態確認

## アーキテクチャ

### レイヤー構成
1. **Handlers**: API Gateway からのリクエストを受け取る
2. **Services**: ビジネスロジックを処理
3. **Repositories**: データベースアクセス
4. **Utils**: 共通ユーティリティ

### 認証フロー
1. Cognito User Pool での認証
2. JWT トークンの発行・検証
3. Lambda Authorizer による認可

### データベース設計
- **Users**: ユーザー情報
- **Podcasts**: ポッドキャスト情報
- **Comments**: コメント
- **Likes**: いいね
- **Follows**: フォロー関係

## 開発ガイドライン

- TypeScript strict モードを使用
- ESLint + Prettier でコード品質を保持
- Zod でランタイム型検証
- AWS SDK v3 を使用
- エラーハンドリングを適切に実装 