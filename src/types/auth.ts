import { z } from 'zod';

// ログインリクエスト
export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

// 登録リクエスト
export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().min(3).max(30),
  displayName: z.string().min(1).max(50),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

// パスワードリセットリクエスト
export const ResetPasswordRequestSchema = z.object({
  email: z.string().email(),
});

export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;

// パスワード変更リクエスト
export const ChangePasswordRequestSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
});

export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;

// 認証レスポンス
export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    username: z.string(),
    displayName: z.string(),
    avatarUrl: z.string().url().optional(),
    isVerified: z.boolean(),
  }),
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;

// トークンリフレッシュリクエスト
export const RefreshTokenRequestSchema = z.object({
  refreshToken: z.string(),
});

export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;

// JWT ペイロード
export const JWTPayloadSchema = z.object({
  sub: z.string(), // ユーザーID
  email: z.string().email(),
  username: z.string(),
  iat: z.number(),
  exp: z.number(),
});

export type JWTPayload = z.infer<typeof JWTPayloadSchema>; 