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

// Generated型の便利なエイリアス
import type { components as GeneratedComponents } from "./types/generated/script";
export type PostCreateScriptRequest =
  GeneratedComponents["schemas"]["PostCreateScriptRequest"];
export type PostCreateScriptResponse =
  GeneratedComponents["schemas"]["PostCreateScriptResponse"];

// ユーティリティのエクスポート
export * from "./utils/response";
export * from "./utils/converter/script";

// アプリケーション層のエクスポート
export * from "./application/usecases/ScriptUsecases";
export * from "./application/usecases/SystemPrompts";

// インフラストラクチャ層のエクスポート
export { default as customOpenaiAgent } from "./infrastructure/agents/openaiAgent";
