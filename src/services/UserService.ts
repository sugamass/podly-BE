import { UserRepository } from "../repositories/UserRepository";
import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserProfile,
  CreateUserRequestSchema,
  UpdateUserRequestSchema,
  CreateUserRequestApi,
  UpdateUserRequestApi,
  convertCreateUserRequestToInternal,
  convertUpdateUserRequestToInternal,
} from "../types/user";

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * ユーザー作成
   */
  async createUser(apiData: any): Promise<User> {
    // バリデーション（APIスキーマ）
    const validatedApiData = this.validateSchema<CreateUserRequestApi>(
      CreateUserRequestSchema,
      apiData
    );

    // 内部型に変換
    const internalData = convertCreateUserRequestToInternal(validatedApiData);

    // ユーザー名・メールアドレスの重複チェック
    const existingUser = await this.userRepository.findByEmailOrUsername(
      internalData.email,
      internalData.username
    );

    if (existingUser) {
      const error = new Error(
        "メールアドレスまたはユーザー名が既に使用されています"
      );
      error.name = "ConflictError";
      throw error;
    }

    // ユーザー作成
    const newUser: User = {
      id: this.generateUserId(),
      email: internalData.email,
      username: internalData.username,
      displayName: internalData.displayName,
      bio: internalData.bio,
      avatarUrl: undefined,
      isVerified: false,
      followersCount: 0,
      followingCount: 0,
      podcastsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return await this.userRepository.create(newUser);
  }

  /**
   * ユーザープロフィール取得
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    return await this.userRepository.getProfile(userId);
  }

  /**
   * ユーザープロフィール更新
   */
  async updateUserProfile(
    userId: string,
    apiData: any
  ): Promise<UserProfile | null> {
    // バリデーション（APIスキーマ）
    const validatedApiData = this.validateSchema<UpdateUserRequestApi>(
      UpdateUserRequestSchema,
      apiData
    );

    // 内部型に変換
    const internalData = convertUpdateUserRequestToInternal(validatedApiData);

    // ユーザー存在チェック
    const existingUser = await this.userRepository.findById(userId);
    if (!existingUser) {
      const error = new Error("ユーザーが見つかりません");
      error.name = "NotFoundError";
      throw error;
    }

    // 更新データを作成
    const updateData: Partial<User> = {
      updatedAt: new Date().toISOString(),
    };

    if (internalData.displayName !== undefined) {
      updateData.displayName = internalData.displayName;
    }
    if (internalData.bio !== undefined) {
      updateData.bio = internalData.bio;
    }
    if (internalData.avatarUrl !== undefined) {
      updateData.avatarUrl = internalData.avatarUrl;
    }

    await this.userRepository.update(userId, updateData);

    return this.userRepository.getProfile(userId);
  }

  /**
   * バリデーション関数
   */
  private validateSchema<T>(schema: any, data: any): T {
    try {
      return schema.parse(data);
    } catch (error: any) {
      const validationError = new Error("バリデーションエラー");
      validationError.name = "ValidationError";
      (validationError as any).errors = error.errors?.map(
        (e: any) => e.message
      ) || [error.message];
      throw validationError;
    }
  }

  /**
   * ユーザーID生成
   */
  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}
