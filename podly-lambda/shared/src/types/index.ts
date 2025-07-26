// 基本API型
export type {
  ApiResponse,
  PodcastRequest,
  Podcast,
  ErrorResponse,
} from "./api";

// 生成された型をインポートして再エクスポート
export type {
  paths as ScriptPaths,
  components as ScriptComponents,
  operations as ScriptOperations,
} from "./generated/script";

// 生成された型ファイルからimport
import type { components as ScriptComp } from "./generated/script";

// 便利な型エイリアス（生成された型から抽出）
export type Reference = ScriptComp["schemas"]["Reference"];
export type ScriptData = ScriptComp["schemas"]["ScriptData"];
export type PostCreateScriptRequest =
  ScriptComp["schemas"]["PostCreateScriptRequest"];
export type PostCreateScriptResponse =
  ScriptComp["schemas"]["PostCreateScriptResponse"];
export type PromptScriptData = ScriptComp["schemas"]["PromptScriptData"];
