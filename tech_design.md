# 技術設計

## バックエンド

- **API**: AWS Lambda + API Gateway（Serverless Framework）でサーバレス構成
- **ローカル開発**: Serverless Framework を使用
- **認証**: AWS Cognito
- **データベース**: DynamoDB（ユーザー・メタ情報）
- **ストレージ**: AWS S3（音声ファイル）

## インフラ / サーバー

- **ホスティング**:
  - フロントエンド: Expo + EAS Build/Submit（簡単にアプリストア出せる）
  - バックエンド: AWS Lambda
- **音声ストリーミング再生**: CDN
- **インフラ管理**: Terraform（AWS の各種サービスをコードで管理）

## レコメンド / パーソナライズ

- **アルゴリズム**:
  - MVP: 「ジャンル + 人気順 + ユーザーの反応（いいね等）」の簡易ロジック
  - 将来: Matrix Factorization や Embedding 学習ベース
  - サービス: Amazon Personalize または OpenSearch
- **サーバー実装**:
  - Python + FastAPI でバッチ学習＆推薦エンジン API
  - スケーラブル対応: AWS SageMaker
