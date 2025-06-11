import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../../src/handlers/user/create';
import { UserService } from '../../src/services/UserService';
import { HTTP_STATUS } from '../../src/constants/api';

// UserServiceをモック化
jest.mock('../../src/services/UserService');

describe('ユーザー作成API', () => {
  let mockUserService: jest.Mocked<UserService>;
  let mockEvent: APIGatewayProxyEvent;

  beforeEach(() => {
    // UserServiceのモックを作成
    mockUserService = new UserService() as jest.Mocked<UserService>;
    (UserService as jest.Mock).mockImplementation(() => mockUserService);

    // モックイベントを作成
    mockEvent = {
      body: null,
      headers: {},
      multiValueHeaders: {},
      httpMethod: 'POST',
      isBase64Encoded: false,
      path: '/users',
      pathParameters: null,
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      stageVariables: null,
      requestContext: {} as any,
      resource: '',
    };

    // コンソールログをモック化（テスト出力をクリーンに保つため）
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('正常系', () => {
    it('有効なデータでユーザーが正常に作成される', async () => {
      // テストデータ
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        bio: 'This is a test user'
      };

      const expectedUser = {
        id: 'user_123456789_abc123',
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        bio: 'This is a test user',
        avatarUrl: undefined,
        isVerified: false,
        followersCount: 0,
        followingCount: 0,
        podcastsCount: 0,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      // モックの設定
      mockEvent.body = JSON.stringify(userData);
      mockUserService.createUser.mockResolvedValue(expectedUser);

      // テスト実行
      const result = await handler(mockEvent);

      // 検証
      expect(result.statusCode).toBe(HTTP_STATUS.CREATED);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data).toEqual(expectedUser);
      expect(mockUserService.createUser).toHaveBeenCalledWith(userData);
    });

    it('bioが空でもユーザーが正常に作成される', async () => {
      // テストデータ（bioなし）
      const userData = {
        email: 'test2@example.com',
        username: 'testuser2',
        displayName: 'Test User 2'
      };

      const expectedUser = {
        id: 'user_123456789_def456',
        email: 'test2@example.com',
        username: 'testuser2',
        displayName: 'Test User 2',
        bio: undefined,
        avatarUrl: undefined,
        isVerified: false,
        followersCount: 0,
        followingCount: 0,
        podcastsCount: 0,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      // モックの設定
      mockEvent.body = JSON.stringify(userData);
      mockUserService.createUser.mockResolvedValue(expectedUser);

      // テスト実行
      const result = await handler(mockEvent);

      // 検証
      expect(result.statusCode).toBe(HTTP_STATUS.CREATED);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data).toEqual(expectedUser);
    });
  });

  describe('バリデーションエラー', () => {
    it('無効なメールアドレスでバリデーションエラーが返される', async () => {
      const userData = {
        email: 'invalid-email',
        username: 'testuser',
        displayName: 'Test User'
      };

      // モックの設定
      mockEvent.body = JSON.stringify(userData);
      const validationError = new Error('バリデーションエラー');
      validationError.name = 'ValidationError';
      (validationError as any).errors = ['メールアドレスの形式が正しくありません'];
      mockUserService.createUser.mockRejectedValue(validationError);

      // テスト実行
      const result = await handler(mockEvent);

      // 検証
      expect(result.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error.details.errors).toContain('メールアドレスの形式が正しくありません');
    });

    it('短すぎるユーザー名でバリデーションエラーが返される', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'ab', // 3文字未満
        displayName: 'Test User'
      };

      // モックの設定
      mockEvent.body = JSON.stringify(userData);
      const validationError = new Error('バリデーションエラー');
      validationError.name = 'ValidationError';
      (validationError as any).errors = ['ユーザー名は3文字以上である必要があります'];
      mockUserService.createUser.mockRejectedValue(validationError);

      // テスト実行
      const result = await handler(mockEvent);

      // 検証
      expect(result.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error.details.errors).toContain('ユーザー名は3文字以上である必要があります');
    });

    it('空の表示名でバリデーションエラーが返される', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        displayName: '' // 空文字
      };

      // モックの設定
      mockEvent.body = JSON.stringify(userData);
      const validationError = new Error('バリデーションエラー');
      validationError.name = 'ValidationError';
      (validationError as any).errors = ['表示名は必須です'];
      mockUserService.createUser.mockRejectedValue(validationError);

      // テスト実行
      const result = await handler(mockEvent);

      // 検証
      expect(result.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error.details.errors).toContain('表示名は必須です');
    });

    it('必須フィールドが不足している場合にバリデーションエラーが返される', async () => {
      const userData = {
        email: 'test@example.com'
        // username と displayName が不足
      };

      // モックの設定
      mockEvent.body = JSON.stringify(userData);
      const validationError = new Error('バリデーションエラー');
      validationError.name = 'ValidationError';
      (validationError as any).errors = [
        'ユーザー名は必須です',
        '表示名は必須です'
      ];
      mockUserService.createUser.mockRejectedValue(validationError);

      // テスト実行
      const result = await handler(mockEvent);

      // 検証
      expect(result.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error.details.errors).toEqual(expect.arrayContaining([
        'ユーザー名は必須です',
        '表示名は必須です'
      ]));
    });
  });

  describe('重複エラー', () => {
    it('既存のメールアドレスで重複エラーが返される', async () => {
      const userData = {
        email: 'existing@example.com',
        username: 'newuser',
        displayName: 'New User'
      };

      // モックの設定
      mockEvent.body = JSON.stringify(userData);
      const conflictError = new Error('メールアドレスまたはユーザー名が既に使用されています');
      conflictError.name = 'ConflictError';
      mockUserService.createUser.mockRejectedValue(conflictError);

      // テスト実行
      const result = await handler(mockEvent);

      // 検証
      expect(result.statusCode).toBe(HTTP_STATUS.CONFLICT);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error.code).toBe('USER_CONFLICT');
      expect(responseBody.error.message).toBe('メールアドレスまたはユーザー名が既に使用されています');
    });

    it('既存のユーザー名で重複エラーが返される', async () => {
      const userData = {
        email: 'new@example.com',
        username: 'existinguser',
        displayName: 'New User'
      };

      // モックの設定
      mockEvent.body = JSON.stringify(userData);
      const conflictError = new Error('メールアドレスまたはユーザー名が既に使用されています');
      conflictError.name = 'ConflictError';
      mockUserService.createUser.mockRejectedValue(conflictError);

      // テスト実行
      const result = await handler(mockEvent);

      // 検証
      expect(result.statusCode).toBe(HTTP_STATUS.CONFLICT);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error.code).toBe('USER_CONFLICT');
    });
  });

  describe('エラーハンドリング', () => {
    it('リクエストボディが空の場合にバリデーションエラーが返される', async () => {
      // モックの設定（bodyが空）
      mockEvent.body = null;

      // 空のbodyの場合、JSON.parseで{}になり、バリデーションエラーが発生する
      const validationError = new Error('バリデーションエラー');
      validationError.name = 'ValidationError';
      (validationError as any).errors = ['必須フィールドが不足しています'];
      mockUserService.createUser.mockRejectedValue(validationError);

      // テスト実行
      const result = await handler(mockEvent);

      // 検証
      expect(result.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(false);
    });

    it('不正なJSONでエラーが返される', async () => {
      // モックの設定（不正なJSON）
      mockEvent.body = '{ invalid json }';

      // テスト実行
      const result = await handler(mockEvent);

      // 検証
      expect(result.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(false);
    });

    it('予期しないエラーで内部サーバーエラーが返される', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User'
      };

      // モックの設定
      mockEvent.body = JSON.stringify(userData);
      const unexpectedError = new Error('データベース接続エラー');
      mockUserService.createUser.mockRejectedValue(unexpectedError);

      // テスト実行
      const result = await handler(mockEvent);

      // 検証
      expect(result.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('ログ出力', () => {
    it('ユーザー作成時に適切なログが出力される', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User'
      };

      const expectedUser = {
        id: 'user_123456789_abc123',
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        bio: undefined,
        avatarUrl: undefined,
        isVerified: false,
        followersCount: 0,
        followingCount: 0,
        podcastsCount: 0,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      // モックの設定
      mockEvent.body = JSON.stringify(userData);
      mockUserService.createUser.mockResolvedValue(expectedUser);

      // テスト実行
      await handler(mockEvent);

      // ログ出力の検証
      expect(console.log).toHaveBeenCalledWith('Creating user with event:', expect.any(String));
      expect(console.log).toHaveBeenCalledWith('Request body:', userData);
      expect(console.log).toHaveBeenCalledWith('User created successfully:', expectedUser.id);
    });

    it('エラー時に適切なログが出力される', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User'
      };

      // モックの設定
      mockEvent.body = JSON.stringify(userData);
      const error = new Error('テストエラー');
      mockUserService.createUser.mockRejectedValue(error);

      // テスト実行
      await handler(mockEvent);

      // エラーログの検証
      expect(console.error).toHaveBeenCalledWith('Error creating user:', error);
    });
  });
}); 