import { z } from 'zod';

// ユーザー基本情報
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

// ユーザー作成リクエスト
export const CreateUserRequestSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30),
  displayName: z.string().min(1).max(50),
  bio: z.string().max(500).optional(),
});

export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;

// ユーザー更新リクエスト
export const UpdateUserRequestSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
});

export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;

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