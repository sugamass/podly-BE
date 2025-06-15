// 手動で定義した型をエクスポート
export * from "./user";
export * from "./auth";
export * from "./podcast";
export * from "./api";

// 自動生成された型をメインからエクスポート（重複を避けるため）
export type {
  paths,
  components,
  operations,
  external,
  webhooks,
  $defs,
} from "./generated/main-api";

// 個別API用の型を名前空間付きでエクスポート
export type * as UserApiTypes from "./generated/user-api";
export type * as ContentApiTypes from "./generated/content-api";
export type * as LikeApiTypes from "./generated/like-api";

// 便利な型エイリアス
import type { external } from "./generated/main-api";

export type UserSchema =
  external["user-api.yaml"]["components"]["schemas"]["User"];
export type PodcastSchema =
  external["content-api.yaml"]["components"]["schemas"]["Podcast"];
export type CommentSchema =
  external["content-api.yaml"]["components"]["schemas"]["Comment"];
export type CreatePodcastRequest =
  external["content-api.yaml"]["components"]["schemas"]["CreatePodcastRequest"];
export type CreateUserRequest =
  external["user-api.yaml"]["components"]["schemas"]["CreateUserRequest"];

// API レスポンス型のエイリアス
export type GetPodcastsResponse =
  external["content-api.yaml"]["components"]["schemas"]["GetPodcastsResponse"];
export type GetUserResponse =
  external["user-api.yaml"]["components"]["schemas"]["GetUserResponse"];
export type CreatePodcastResponse =
  external["content-api.yaml"]["components"]["schemas"]["CreatePodcastResponse"];

// よく使用される型の便利なエイリアス
import type { paths, operations } from "./generated/main-api";

export type ApiPaths = keyof paths;

// 特定のAPIエンドポイントとメソッドの型を取得
export type GetPodcastsOperation = operations["getPodcasts"];
export type CreatePodcastOperation = operations["createPodcast"];
export type GetUserOperation = operations["getUser"];
export type CreateUserOperation = operations["createUser"];

// リクエスト・レスポンス型の取得例
export type GetPodcastsRequest = GetPodcastsOperation["parameters"];
export type GetPodcastsResponseData =
  GetPodcastsOperation["responses"][200]["content"]["application/json"];

export type CreatePodcastRequestBody =
  CreatePodcastOperation["requestBody"]["content"]["application/json"];
export type CreatePodcastResponseData =
  CreatePodcastOperation["responses"][201]["content"]["application/json"];

// 使用例:
// const response: GetPodcastsResponseData = await api.getPodcasts();
// const request: CreatePodcastRequestBody = { title: 'test', script: 'test' };
