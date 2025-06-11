# テストガイド

このディレクトリには、ユーザー作成APIの包括的なテストスイートが含まれています。

## テストの構成

### ユニットテスト

#### `user/create.test.ts`
- **目的**: ユーザー作成APIハンドラーのユニットテスト
- **対象**: `src/handlers/user/create.ts`
- **特徴**:
  - UserServiceをモック化
  - APIハンドラーの動作を単体でテスト
  - エラーハンドリングとレスポンス形式を検証

#### `services/UserService.test.ts`
- **目的**: UserServiceのユニットテスト
- **対象**: `src/services/UserService.ts`
- **特徴**:
  - UserRepositoryをモック化
  - ビジネスロジックを単体でテスト
  - バリデーションと重複チェックを検証

## テストの実行

### 全テストの実行
```bash
npm test
```

### 特定のテストファイルの実行
```bash
# APIハンドラーのテスト
npm test -- __tests__/user/create.test.ts

# UserServiceのテスト
npm test -- __tests__/services/UserService.test.ts
```

### ウォッチモードでの実行
```bash
npm run test:watch
```

### カバレッジレポートの生成
```bash
npm test -- --coverage
```

## テストケース

### 正常系
- ✅ 有効なデータでユーザーが正常に作成される
- ✅ bioが空でもユーザーが正常に作成される
- ✅ 正しいレスポンス形式が返される

### バリデーションエラー
- ❌ 無効なメールアドレス
- ❌ 短すぎるユーザー名（3文字未満）
- ❌ 空の表示名
- ❌ 長すぎるbio（500文字超）
- ❌ 必須フィールドの不足

### 重複エラー
- ❌ 既存のメールアドレス
- ❌ 既存のユーザー名

### エラーハンドリング
- ❌ リクエストボディが空
- ❌ 不正なJSON
- ❌ 予期しないサーバーエラー

## モック化の方針

### ユニットテスト
- **UserService**: UserRepositoryをモック化
- **APIハンドラー**: UserServiceをモック化
- **外部依存**: データベース、AWS SDKなどをモック化

## テスト環境の設定

### 必要な環境変数
```bash
# テスト実行時は環境変数は不要（モック化されているため）
NODE_ENV=test
```

## CI/CDでの実行

### GitHub Actions設定例
```yaml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
```

## テストのベストプラクティス

### 1. テストの独立性
- 各テストは他のテストに依存しない
- テスト間でデータを共有しない
- beforeEach/afterEachでクリーンアップ

### 2. 明確なテスト名
- 日本語でテストの意図を明確に記述
- 「何をテストするか」が分かりやすい名前

### 3. AAA パターン
- **Arrange**: テストデータとモックの設定
- **Act**: テスト対象の実行
- **Assert**: 結果の検証

### 4. エラーケースの網羅
- 正常系だけでなく異常系も必ずテスト
- エッジケースも考慮

### 5. モックの適切な使用
- 必要最小限のモック化
- モックの動作は実際の実装に近づける

## トラブルシューティング

### よくある問題

#### 1. モックが正しく動作しない
```typescript
// ❌ 間違い
jest.mock('./UserService');

// ✅ 正しい
jest.mock('../../src/services/UserService');
```

#### 2. 非同期テストのタイムアウト
```typescript
// テストタイムアウトを延長
it('長時間かかるテスト', async () => {
  // テスト内容
}, 30000); // 30秒
```

#### 3. AWS認証エラー
- ユニットテストではAWS SDKをモック化
- 実際のAWSリソースにアクセスしない設計

### デバッグ方法

#### 1. ログ出力の有効化
```typescript
// テスト中のログを表示
beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(console.log);
  jest.spyOn(console, 'error').mockImplementation(console.error);
});
```

#### 2. テストの詳細出力
```bash
npm test -- --verbose
```

#### 3. 特定のテストのみ実行
```typescript
// 一時的にfitやfdescribeを使用
fit('このテストのみ実行', () => {
  // テスト内容
});
```

## 注意事項

- このテストスイートはユニットテストのみで構成されています
- 実際のデータベースやAWSリソースにはアクセスしません
- 統合テストが必要な場合は、別途テスト環境を構築してください 