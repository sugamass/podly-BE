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

## 開発ルール・ガイドライン

### 型生成・スキーマ管理

#### OpenAPI 仕様による型駆動開発

1. **API 設計の起点**: `docs/` 配下の YAML ファイルが API の仕様書

   - `docs/script.yaml` - スクリプト生成 API
   - `docs/audio.yaml` - 音声プレビュー API

2. **型生成フロー**:

   ```bash
   # YAMLファイル更新後は必ず型生成を実行
   npm run generate-types  # (実装予定)

   # または手動で以下のファイルを更新
   # - shared/src/types/generated/script.ts
   # - shared/src/types/generated/audio.ts
   ```

3. **型定義の階層**:
   ```
   shared/src/types/
   ├── generated/          # 自動生成（OpenAPI YAML → TypeScript）
   │   ├── script.ts      # docs/script.yaml から生成
   │   └── audio.ts       # docs/audio.yaml から生成
   ├── index.ts           # 便利な型エイリアス
   └── api.ts             # 共通API型
   ```

#### スキーマ変更時の必須手順

1. **YAML 更新** → `docs/*.yaml` のスキーマを修正
2. **型生成** → 生成された型定義を更新
3. **Domain 型同期** → `domain/*/entities/*.ts` のドメイン型を更新
4. **Converter 修正** → `utils/converter/*.ts` の変換ロジックを修正
5. **UseCase 修正** → 必要に応じてビジネスロジックを修正
6. **Validation 更新** → `infrastructure/validation/*.ts` の Zod スキーマを更新
7. **ビルド確認** → `npm run build` で型エラーがないことを確認

### Clean Architecture ルール

#### レイヤー構成と依存関係

```
┌─────────────────┐
│   Handler層     │ ← Lambda関数のエントリーポイント
├─────────────────┤
│ Application層   │ ← UseCase・ビジネスロジック
├─────────────────┤
│   Domain層     │ ← エンティティ・ビジネスルール
├─────────────────┤
│Infrastructure層 │ ← 外部サービス連携・技術詳細
└─────────────────┘
```

#### 依存方向のルール

- **上位層は下位層に依存可能**
- **下位層は上位層に依存禁止**
- **Domain 層は最も独立性が高い**
- **Infrastructure 層は Domain 層のインターフェースを実装**

#### ファイル配置ルール

```
shared/src/
├── application/
│   └── usecases/          # ビジネスロジック・ユースケース
├── domain/
│   └── */entities/        # ドメインエンティティ・ビジネスルール
├── infrastructure/
│   ├── agents/           # 外部API連携エージェント
│   └── validation/       # バリデーション処理
├── types/                # 型定義
└── utils/                # ユーティリティ・変換処理
```

### 型安全性の確保

#### 1. API ↔ Domain 変換の型安全性

```typescript
// ❌ 悪い例: any型の使用
const convertApiToDomain = (apiData: any) => { ... }

// ✅ 良い例: 明示的な型変換
const convertApiToDomain = (
  apiData: PostCreateScriptRequest
): CreateScriptUseCaseInput => { ... }
```

#### 2. バリデーションの必須化

```typescript
// リクエスト受信時は必ずバリデーション
const validatedRequest = SchemaValidator.validateScriptRequest(request);

// レスポンス送信前も必ずバリデーション
const validatedResponse = SchemaValidator.validateScriptResponse(response);
```

#### 3. 環境変数の型安全性

```typescript
// 環境変数アクセスは型チェック付きで
const config = {
  openaiApiKey:
    process.env.OPENAI_API_KEY ||
    (() => {
      throw new Error("OPENAI_API_KEY is required");
    })(),
};
```

### エラーハンドリング・ログ出力

#### 統一エラーレスポンス

```typescript
// 成功レスポンス
return createResponse(200, result);

// エラーレスポンス
return createErrorResponse(400, "Invalid request parameters", error);
```

#### ログ出力ルール

```typescript
// エラーログ: 必ず詳細情報を含める
console.error("Script generation failed:", {
  prompt: request.prompt,
  error: error.message,
  stack: error.stack,
});

// 情報ログ: 処理の進行状況を記録
console.log("Starting script generation:", {
  promptLength: request.prompt.length,
  hasReference: !!request.reference?.length,
});
```

### テスト・品質保証

#### 必須テスト項目

1. **型変換テスト**: API ↔ Domain の変換が正しく動作すること
2. **バリデーションテスト**: 不正なリクエストが適切に拒否されること
3. **ビジネスロジックテスト**: ユースケースが期待通りに動作すること
4. **統合テスト**: エンドツーエンドで API が動作すること

#### ビルド前チェック

```bash
# 必須: 型チェック
npm run build

# 推奨: リント
npm run lint  # (ESLint設定後)

# 推奨: テスト
npm run test  # (Jest設定後)
```

### デプロイ・運用

#### 環境変数管理

| 変数名           | 必須 | 説明                           |
| ---------------- | ---- | ------------------------------ |
| `NODE_ENV`       | ✅   | 環境名（dev/staging/prod）     |
| `STAGE`          | ✅   | ステージ名                     |
| `OPENAI_API_KEY` | ✅   | OpenAI API キー                |
| `TAVILY_API_KEY` | ✅   | Tavily API キー（検索用）      |
| `FFMPEG_PATH`    | ⚠️   | FFmpeg パス（audio 関数のみ）  |
| `FFPROBE_PATH`   | ⚠️   | FFprobe パス（audio 関数のみ） |

#### デプロイ用パッケージング

```bash
# 全関数をビルド・パッケージ化
npm run build

# デプロイ用zipファイルが生成される
# dist/create-script.zip
# dist/create-preview-audio.zip
```

### コードレビュー・チェックリスト

#### 必須チェック項目

- [ ] OpenAPI YAML と TypeScript 型定義が一致しているか
- [ ] Domain 型と API 型の変換処理が正しく実装されているか
- [ ] バリデーション処理が適切に実装されているか
- [ ] エラーハンドリングが適切に実装されているか
- [ ] ログ出力が適切に実装されているか
- [ ] TypeScript ビルドが成功するか
- [ ] Clean Architecture の依存関係が正しいか

#### 推奨チェック項目

- [ ] パフォーマンスに問題がないか
- [ ] セキュリティに問題がないか
- [ ] テストカバレッジが十分か
- [ ] ドキュメントが更新されているか

### その他の開発ガイドライン

#### GraphAI エージェント使用時

```typescript
// GraphAIのエージェント定義は infrastructure/agents/ に配置
// カスタムエージェントには適切な型定義を付与
const customAgent: AgentFunction<InputType, OutputType> = async (
  namedInputs
) => {
  // 処理実装
};
```

#### 外部 API 連携

```typescript
// 外部API呼び出しは必ずエラーハンドリング付きで
try {
  const result = await openaiClient.chat.completions.create(params);
  return result;
} catch (error) {
  console.error("OpenAI API call failed:", error);
  throw new Error("Failed to generate script");
}
```

## 開発コマンド

### 型チェック

```bash
npm run lint  # (設定後)
```

### クリーンアップ

```bash
npm run clean
```

### 型生成 (実装予定)

```bash
npm run generate-types
```
