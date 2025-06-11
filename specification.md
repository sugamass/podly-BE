# アプリ仕様

## コンセプト

ポッドキャストの原稿と音声を AI で自動生成し、配信するプラットフォームモバイルアプリ

## ポッドキャスト生成機能

### 原稿作成機能

- 「〇〇についてまとめて」とユーザーが指示し、アプリ側が web 検索も活用して原稿を生成する
- URL から原稿生成

### 音声生成機能

- TTS モデルとボイスが選択可能

## ポッドキャスト配信機能

- tiktok のような縦スクロール
- バックグラウンド再生
- 基本機能（いいね、保存、フォロー、コメント）
- 文字起こしの表示

# 設計

### フロントエンド（モバイル）

- **フレームワーク**: React Native + TypeScript + expo

- **状態管理**: Zustand
- **音声再生**: react-native-track-player（ネイティブコードなので EAS Build を使う必要あり）
- **データ取得**: React Query（`@tanstack/react-query`）

### バックエンド

### インフラ / サーバー

** AWS の各種サービスは、Terrafrom でコードで管理できるようにする**

- **API**:
- - AWS Lambda + API Gateway（Chalice や Serverless Framework）でサーバレス構成

    - Serverless Framework を使ってローカルで開発する
- **ホスティング**:
  - フロント: Expo + EAS Build/Submit（簡単にアプリストア出せる）
  - バックエンド: AWS Lambda
- **DB（ユーザー・メタ情報）**:
  - DynamoDB
- **認証**:
- - Cognito

- **ストレージ（音声ファイル）**:
  - AWS S3（安定・コスパ ◎）
- **音声ストリーミング再生**:

  - CDN
