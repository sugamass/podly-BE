// 型定義のエクスポート
export type { ApiResponse, ErrorResponse } from "./types/api";
export type { components } from "./types/generated/script";
export type {
  PromptScriptData,
  ScriptData,
  CreateScriptUseCaseInput,
  CreateScriptUseCaseOutput,
  Situation,
  Reference,
} from "./domain/script/entities/ScriptEntity";

// 音声関連の型定義のエクスポート
export type {
  AudioScriptData,
  AudioPreviewUseCaseInput,
  AudioPreviewUseCaseOutput,
  TTSProvider,
} from "./domain/audio/entities/AudioEntity";
export type { PodcastScript } from "./infrastructure/agents/type";

// Generated型の便利なエイリアス
import type { components as GeneratedComponents } from "./types/generated/script";
export type PostCreateScriptRequest =
  GeneratedComponents["schemas"]["PostCreateScriptRequest"];
export type PostCreateScriptResponse =
  GeneratedComponents["schemas"]["PostCreateScriptResponse"];

// ユーティリティのエクスポート
export * from "./utils/response";
export * from "./utils/converter/script";
export * from "./utils/converter/audio";

// アプリケーション層のエクスポート
export * from "./application/usecases/ScriptUsecases";
export * from "./application/usecases/AudioUsecases";
export * from "./application/usecases/SystemPrompts";

// インフラストラクチャ層のエクスポート
export { default as customOpenaiAgent } from "./infrastructure/agents/openaiAgent";
export { default as customTtsOpenaiAgent } from "./infrastructure/agents/custom_tts_openai_agent";
export { default as combineFilesAgent } from "./infrastructure/agents/combine_files_agent";
export { default as addBGMAgent } from "./infrastructure/agents/add_bgm_agent";
export { default as createDataForHlsAgent } from "./infrastructure/agents/create_data_for_hls_agent";
export { default as waitForFileAgent } from "./infrastructure/agents/wait_for_file_agent";
