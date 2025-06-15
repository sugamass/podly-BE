import { z } from "zod";

// ユーザー基本情報（内部用・キャメルケース）
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  username: z.string().min(3).max(30),
  displayName: z.string().min(1).max(50),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
  isVerified: z.boolean().default(false),
  followersCount: z.number().int().min(0).default(0),
  followingCount: z.number().int().min(0).default(0),
  podcastsCount: z.number().int().min(0).default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type User = z.infer<typeof UserSchema>;

// ユーザー作成リクエスト（API用・スネークケース）
export const CreateUserRequestSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30),
  display_name: z.string().min(1).max(50),
  bio: z.string().max(500).optional(),
});

export type CreateUserRequestApi = z.infer<typeof CreateUserRequestSchema>;

// ユーザー作成リクエスト（内部用・キャメルケース）
export interface CreateUserRequest {
  email: string;
  username: string;
  displayName: string;
  bio?: string;
}

// ユーザー更新リクエスト（API用・スネークケース）
export const UpdateUserRequestSchema = z.object({
  display_name: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  avatar_url: z.string().url().optional(),
});

export type UpdateUserRequestApi = z.infer<typeof UpdateUserRequestSchema>;

// ユーザー更新リクエスト（内部用・キャメルケース）
export interface UpdateUserRequest {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
}

// ユーザープロフィール（公開情報）
export const UserProfileSchema = UserSchema.omit({
  email: true,
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// フォロー関係
export const FollowSchema = z.object({
  followerId: z.string(),
  followingId: z.string(),
  createdAt: z.string().datetime(),
});

export type Follow = z.infer<typeof FollowSchema>;

// 変換関数
export const convertCreateUserRequestToInternal = (
  apiRequest: CreateUserRequestApi
): CreateUserRequest => ({
  email: apiRequest.email,
  username: apiRequest.username,
  displayName: apiRequest.display_name,
  bio: apiRequest.bio,
});

export const convertUpdateUserRequestToInternal = (
  apiRequest: UpdateUserRequestApi
): UpdateUserRequest => ({
  displayName: apiRequest.display_name,
  bio: apiRequest.bio,
  avatarUrl: apiRequest.avatar_url,
});

export const convertUserToApi = (user: User): any => ({
  id: user.id,
  email: user.email,
  username: user.username,
  display_name: user.displayName,
  bio: user.bio,
  avatar_url: user.avatarUrl,
  is_verified: user.isVerified,
  followers_count: user.followersCount,
  following_count: user.followingCount,
  podcasts_count: user.podcastsCount,
  created_at: user.createdAt,
  updated_at: user.updatedAt,
});

export const convertUserProfileToApi = (userProfile: UserProfile): any => ({
  id: userProfile.id,
  username: userProfile.username,
  display_name: userProfile.displayName,
  bio: userProfile.bio,
  avatar_url: userProfile.avatarUrl,
  is_verified: userProfile.isVerified,
  followers_count: userProfile.followersCount,
  following_count: userProfile.followingCount,
  podcasts_count: userProfile.podcastsCount,
  created_at: userProfile.createdAt,
  updated_at: userProfile.updatedAt,
});
