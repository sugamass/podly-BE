import { z } from 'zod';

// ポッドキャスト基本情報
export const PodcastSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  script: z.string(),
  audioUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  duration: z.number().int().min(0), // 秒
  userId: z.string(),
  username: z.string(),
  userDisplayName: z.string(),
  userAvatarUrl: z.string().url().optional(),
  likesCount: z.number().int().min(0).default(0),
  commentsCount: z.number().int().min(0).default(0),
  sharesCount: z.number().int().min(0).default(0),
  viewsCount: z.number().int().min(0).default(0),
  isPublic: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Podcast = z.infer<typeof PodcastSchema>;

// ポッドキャスト作成リクエスト
export const CreatePodcastRequestSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  script: z.string(),
  voiceId: z.string(),
  isPublic: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
});

export type CreatePodcastRequest = z.infer<typeof CreatePodcastRequestSchema>;

// ポッドキャスト更新リクエスト
export const UpdatePodcastRequestSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

export type UpdatePodcastRequest = z.infer<typeof UpdatePodcastRequestSchema>;

// コメント
export const CommentSchema = z.object({
  id: z.string(),
  podcastId: z.string(),
  userId: z.string(),
  username: z.string(),
  userDisplayName: z.string(),
  userAvatarUrl: z.string().url().optional(),
  content: z.string().min(1).max(500),
  likesCount: z.number().int().min(0).default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Comment = z.infer<typeof CommentSchema>;

// コメント作成リクエスト
export const CreateCommentRequestSchema = z.object({
  podcastId: z.string(),
  content: z.string().min(1).max(500),
});

export type CreateCommentRequest = z.infer<typeof CreateCommentRequestSchema>;

// いいね
export const LikeSchema = z.object({
  userId: z.string(),
  podcastId: z.string(),
  createdAt: z.string().datetime(),
});

export type Like = z.infer<typeof LikeSchema>;

// 保存
export const SaveSchema = z.object({
  userId: z.string(),
  podcastId: z.string(),
  createdAt: z.string().datetime(),
});

export type Save = z.infer<typeof SaveSchema>; 