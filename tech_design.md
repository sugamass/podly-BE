# 技術設計

## フロントエンド（モバイル）

- **フレームワーク**: React Native + TypeScript + Expo
- **UIライブラリ**: Tamagui
- **状態管理**: Zustand
- **音声再生**: expo-av または react-native-track-player（ネイティブコードなのでEAS Buildを使う必要あり）
- **データ取得**: React Query（`@tanstack/react-query`）

## バックエンド

- **API**: AWS Lambda + API Gateway（ChaliceやServerless Framework）でサーバレス構成
- **ローカル開発**: Serverless Frameworkを使用
- **認証**: AWS Cognito
- **データベース**: DynamoDB（ユーザー・メタ情報）
- **ストレージ**: AWS S3（音声ファイル、安定・コスパ◎）

## インフラ / サーバー

- **ホスティング**:
  - フロントエンド: Expo + EAS Build/Submit（簡単にアプリストア出せる）
  - バックエンド: AWS Lambda
- **音声ストリーミング再生**: CDN
- **インフラ管理**: Terraform（AWSの各種サービスをコードで管理）

## レコメンド / パーソナライズ

- **アルゴリズム**:
  - MVP: 「ジャンル + 人気順 + ユーザーの反応（いいね等）」の簡易ロジック
  - 将来: Matrix FactorizationやEmbedding学習ベース
  - サービス: Amazon PersonalizeまたはOpenSearch
- **サーバー実装**:
  - Python + FastAPI でバッチ学習＆推薦エンジンAPI
  - スケーラブル対応: AWS SageMaker