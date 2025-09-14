import { z } from "zod";
import * as yaml from "js-yaml";
import * as fs from "fs";
import * as path from "path";

// Script API スキーマ定義
export const ReferenceSchema = z.object({
  title: z.string().optional(),
  url: z.string(),
});

export const ScriptDataSchema = z.object({
  speaker: z.string().optional(),
  text: z.string().optional(),
  caption: z.string().optional(),
});

export const PromptScriptDataSchema = z.object({
  prompt: z.string(),
  title: z.string().optional(),
  script: z.array(ScriptDataSchema).optional(),
  reference: z.array(ReferenceSchema).optional(),
  situation: z.string().optional(),
});

export const PostCreateScriptRequestSchema = z.object({
  prompt: z.string(),
  previousScript: z.array(PromptScriptDataSchema).optional(),
  reference: z.array(ReferenceSchema).optional(),
  isSearch: z.boolean().optional(),
  wordCount: z.number().optional(),
  situation: z
    .enum(["school", "expert", "interview", "friends", "radio_personality"])
    .optional(),
});

export const PostCreateScriptResponseSchema = z.object({
  newScript: PromptScriptDataSchema,
  previousScript: z.array(PromptScriptDataSchema).optional(),
});

// Audio API スキーマ定義
export const AudioScriptDataSchema = z.object({
  speaker: z.string(),
  text: z.string(),
  caption: z.string(),
});

export const AudioPreviewRequestSchema = z.object({
  script: z.array(AudioScriptDataSchema),
  tts: z.string(),
  voices: z.array(z.string()),
  speakers: z.array(z.string()),
  scriptId: z.string().optional(),
  bgmId: z.string().optional(),
  model: z.enum(["gpt-4o-mini-tts", "tts-1", "gemini-2.5-flash-preview-tts"]).optional(),
});

export const AudioPreviewResponseSchema = z.object({
  audioUrl: z.string().optional(),
  separatedAudioUrls: z.array(z.string()).optional(),
  scriptId: z.string().optional(),
  duration: z.number().optional(),
});

export type PostCreateScriptRequest = z.infer<
  typeof PostCreateScriptRequestSchema
>;
export type PostCreateScriptResponse = z.infer<
  typeof PostCreateScriptResponseSchema
>;
export type AudioPreviewRequest = z.infer<typeof AudioPreviewRequestSchema>;
export type AudioPreviewResponse = z.infer<typeof AudioPreviewResponseSchema>;

export class SchemaValidator {
  /**
   * Script作成リクエストをバリデーション
   */
  static validateScriptRequest(data: unknown): PostCreateScriptRequest {
    try {
      return PostCreateScriptRequestSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors
          .map((err) => `${err.path.join(".")}: ${err.message}`)
          .join(", ");
        throw new Error(`Script request validation failed: ${errors}`);
      }
      throw error;
    }
  }

  /**
   * Script作成レスポンスをバリデーション
   */
  static validateScriptResponse(data: unknown): PostCreateScriptResponse {
    try {
      return PostCreateScriptResponseSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors
          .map((err) => `${err.path.join(".")}: ${err.message}`)
          .join(", ");
        throw new Error(`Script response validation failed: ${errors}`);
      }
      throw error;
    }
  }

  /**
   * Audio プレビューリクエストをバリデーション
   */
  static validateAudioPreviewRequest(data: unknown): AudioPreviewRequest {
    try {
      return AudioPreviewRequestSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors
          .map((err) => `${err.path.join(".")}: ${err.message}`)
          .join(", ");
        throw new Error(`Audio preview request validation failed: ${errors}`);
      }
      throw error;
    }
  }

  /**
   * Audio プレビューレスポンスをバリデーション
   */
  static validateAudioPreviewResponse(data: unknown): AudioPreviewResponse {
    try {
      return AudioPreviewResponseSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors
          .map((err) => `${err.path.join(".")}: ${err.message}`)
          .join(", ");
        throw new Error(`Audio preview response validation failed: ${errors}`);
      }
      throw error;
    }
  }

  /**
   * バリデーションエラーの詳細情報を取得
   */
  static getValidationErrorDetails(
    error: z.ZodError
  ): Array<{ path: string; message: string; received?: unknown }> {
    return error.errors.map((err) => ({
      path: err.path.join("."),
      message: err.message,
      received: (err as any).received,
    }));
  }
}
