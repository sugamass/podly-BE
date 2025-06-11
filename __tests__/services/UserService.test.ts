import { UserService } from '../../src/services/UserService';
import { UserRepository } from '../../src/repositories/UserRepository';
import { CreateUserRequest, User } from '../../src/types/user';

// UserRepositoryをモック化
jest.mock('../../src/repositories/UserRepository');

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    // UserRepositoryのモックを作成
    mockUserRepository = new UserRepository() as jest.Mocked<UserRepository>;
    (UserRepository as jest.Mock).mockImplementation(() => mockUserRepository);
    
    userService = new UserService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const validUserData: CreateUserRequest = {
      email: 'test@example.com',
      username: 'testuser',
      displayName: 'Test User',
      bio: 'This is a test user'
    };

    it('有効なデータでユーザーが正常に作成される', async () => {
      // モックの設定
      mockUserRepository.findByEmailOrUsername.mockResolvedValue(null);
      
      const expectedUser: User = {
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
      
      mockUserRepository.create.mockResolvedValue(expectedUser);

      // テスト実行
      const result = await userService.createUser(validUserData);

      // 検証
      expect(result).toEqual(expectedUser);
      expect(mockUserRepository.findByEmailOrUsername).toHaveBeenCalledWith(
        validUserData.email,
        validUserData.username
      );
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: validUserData.email,
          username: validUserData.username,
          displayName: validUserData.displayName,
          bio: validUserData.bio,
          isVerified: false,
          followersCount: 0,
          followingCount: 0,
          podcastsCount: 0
        })
      );
    });

    it('bioが空でもユーザーが正常に作成される', async () => {
      const userDataWithoutBio: CreateUserRequest = {
        email: 'test2@example.com',
        username: 'testuser2',
        displayName: 'Test User 2'
      };

      // モックの設定
      mockUserRepository.findByEmailOrUsername.mockResolvedValue(null);
      
      const expectedUser: User = {
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
      
      mockUserRepository.create.mockResolvedValue(expectedUser);

      // テスト実行
      const result = await userService.createUser(userDataWithoutBio);

      // 検証
      expect(result).toEqual(expectedUser);
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: userDataWithoutBio.email,
          username: userDataWithoutBio.username,
          displayName: userDataWithoutBio.displayName,
          bio: undefined
        })
      );
    });

    describe('バリデーションエラー', () => {
      it('無効なメールアドレスでバリデーションエラーが発生する', async () => {
        const invalidData = {
          email: 'invalid-email',
          username: 'testuser',
          displayName: 'Test User'
        };

        // テスト実行と検証
        await expect(userService.createUser(invalidData as CreateUserRequest))
          .rejects
          .toThrow('バリデーションエラー');
      });

      it('短すぎるユーザー名でバリデーションエラーが発生する', async () => {
        const invalidData = {
          email: 'test@example.com',
          username: 'ab', // 3文字未満
          displayName: 'Test User'
        };

        // テスト実行と検証
        await expect(userService.createUser(invalidData as CreateUserRequest))
          .rejects
          .toThrow('バリデーションエラー');
      });

      it('空の表示名でバリデーションエラーが発生する', async () => {
        const invalidData = {
          email: 'test@example.com',
          username: 'testuser',
          displayName: '' // 空文字
        };

        // テスト実行と検証
        await expect(userService.createUser(invalidData as CreateUserRequest))
          .rejects
          .toThrow('バリデーションエラー');
      });

      it('長すぎるbioでバリデーションエラーが発生する', async () => {
        const invalidData = {
          email: 'test@example.com',
          username: 'testuser',
          displayName: 'Test User',
          bio: 'a'.repeat(501) // 500文字を超える
        };

        // テスト実行と検証
        await expect(userService.createUser(invalidData as CreateUserRequest))
          .rejects
          .toThrow('バリデーションエラー');
      });
    });

    describe('重複エラー', () => {
      it('既存のメールアドレスで重複エラーが発生する', async () => {
        const existingUser: User = {
          id: 'existing-user-id',
          email: 'existing@example.com',
          username: 'existinguser',
          displayName: 'Existing User',
          bio: undefined,
          avatarUrl: undefined,
          isVerified: false,
          followersCount: 0,
          followingCount: 0,
          podcastsCount: 0,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        };

        const duplicateData: CreateUserRequest = {
          email: 'existing@example.com', // 既存のメールアドレス
          username: 'newuser',
          displayName: 'New User'
        };

        // モックの設定
        mockUserRepository.findByEmailOrUsername.mockResolvedValue(existingUser);

        // テスト実行と検証
        await expect(userService.createUser(duplicateData))
          .rejects
          .toThrow('メールアドレスまたはユーザー名が既に使用されています');

        expect(mockUserRepository.findByEmailOrUsername).toHaveBeenCalledWith(
          duplicateData.email,
          duplicateData.username
        );
        expect(mockUserRepository.create).not.toHaveBeenCalled();
      });

      it('既存のユーザー名で重複エラーが発生する', async () => {
        const existingUser: User = {
          id: 'existing-user-id',
          email: 'existing@example.com',
          username: 'existinguser',
          displayName: 'Existing User',
          bio: undefined,
          avatarUrl: undefined,
          isVerified: false,
          followersCount: 0,
          followingCount: 0,
          podcastsCount: 0,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        };

        const duplicateData: CreateUserRequest = {
          email: 'new@example.com',
          username: 'existinguser', // 既存のユーザー名
          displayName: 'New User'
        };

        // モックの設定
        mockUserRepository.findByEmailOrUsername.mockResolvedValue(existingUser);

        // テスト実行と検証
        await expect(userService.createUser(duplicateData))
          .rejects
          .toThrow('メールアドレスまたはユーザー名が既に使用されています');
      });
    });

    it('ユーザーIDが正しく生成される', async () => {
      // モックの設定
      mockUserRepository.findByEmailOrUsername.mockResolvedValue(null);
      
      const expectedUser: User = {
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
      
      mockUserRepository.create.mockResolvedValue(expectedUser);

      // テスト実行
      await userService.createUser(validUserData);

      // 検証 - createが呼ばれた際の引数をチェック
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.stringMatching(/^user_\d+_[a-z0-9]+$/),
          createdAt: expect.any(String),
          updatedAt: expect.any(String)
        })
      );
    });
  });

  describe('getUserProfile', () => {
    it('ユーザープロフィールが正常に取得される', async () => {
      const userId = 'user-123';
      const expectedProfile = {
        id: userId,
        username: 'testuser',
        displayName: 'Test User',
        bio: 'This is a test user',
        avatarUrl: undefined,
        isVerified: false,
        followersCount: 10,
        followingCount: 5,
        podcastsCount: 3,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      // モックの設定
      mockUserRepository.getProfile.mockResolvedValue(expectedProfile);

      // テスト実行
      const result = await userService.getUserProfile(userId);

      // 検証
      expect(result).toEqual(expectedProfile);
      expect(mockUserRepository.getProfile).toHaveBeenCalledWith(userId);
    });

    it('存在しないユーザーの場合nullが返される', async () => {
      const userId = 'non-existent-user';

      // モックの設定
      mockUserRepository.getProfile.mockResolvedValue(null);

      // テスト実行
      const result = await userService.getUserProfile(userId);

      // 検証
      expect(result).toBeNull();
      expect(mockUserRepository.getProfile).toHaveBeenCalledWith(userId);
    });
  });
}); 