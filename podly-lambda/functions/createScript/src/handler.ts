import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import {
  successResponse,
  errorResponse,
  badRequestResponse,
  CreateScriptUseCase,
  convertApiRequestToDomainInput,
  convertDomainOutputToApiResponse,
} from "@podly/shared";

// APIスキーマに基づく型定義
interface ScriptData {
  speaker?: string;
  text?: string;
  caption?: string;
}

interface PromptScriptData {
  prompt: string;
  script?: ScriptData[];
  reference?: string[];
  situation?: string;
}

interface PostCreateScriptRequest {
  prompt: string;
  previousScript?: PromptScriptData[];
  reference?: string[];
  isSearch?: boolean;
  wordCount?: number;
  situation?:
    | "school"
    | "expert"
    | "interview"
    | "friends"
    | "radio_personality";
}

interface PostCreateScriptResponse {
  newScript: PromptScriptData;
  previousScript?: PromptScriptData[];
}

// UseCaseの初期化
const createScriptUseCase = new CreateScriptUseCase();

export const createScript = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("🚀 createScript Lambda function started");
    console.log("📋 Request Event:", JSON.stringify(event, null, 2));

    // リクエストボディの検証
    if (!event.body) {
      console.log("❌ Request body is missing");
      return badRequestResponse("Request body is required");
    }

    let apiRequest: PostCreateScriptRequest;
    try {
      apiRequest = JSON.parse(event.body);
      console.log(
        "📝 Parsed API Request:",
        JSON.stringify(apiRequest, null, 2)
      );
    } catch (error) {
      console.log("❌ JSON parse error:", error);
      return badRequestResponse("Invalid JSON format");
    }

    // 必須フィールドのバリデーション
    if (!apiRequest.prompt || typeof apiRequest.prompt !== "string") {
      console.log("❌ Missing or invalid prompt field");
      return badRequestResponse(
        "Field 'prompt' is required and must be a string"
      );
    }

    // optionalフィールドのバリデーション
    if (
      apiRequest.situation &&
      ![
        "school",
        "expert",
        "interview",
        "friends",
        "radio_personality",
      ].includes(apiRequest.situation)
    ) {
      console.log("❌ Invalid situation value:", apiRequest.situation);
      return badRequestResponse(
        "Field 'situation' must be one of: school, expert, interview, friends, radio_personality"
      );
    }

    console.log("✅ Request validation passed");

    // ドメイン入力への変換
    const domainInput = convertApiRequestToDomainInput(apiRequest);
    console.log("🔄 Domain Input:", JSON.stringify(domainInput, null, 2));

    // ビジネスロジック実行
    console.log("⚡ Executing CreateScriptUseCase...");
    const domainOutput = await createScriptUseCase.execute(domainInput);
    console.log("✅ UseCase execution completed");
    console.log("📤 Domain Output:", JSON.stringify(domainOutput, null, 2));

    // API レスポンスへの変換
    const apiResponse: PostCreateScriptResponse =
      convertDomainOutputToApiResponse(domainOutput);
    console.log("🎯 Final API Response:", JSON.stringify(apiResponse, null, 2));

    return successResponse(apiResponse);
  } catch (error) {
    console.error("💥 Unexpected error in createScript:", error);

    // エラーの詳細をログに出力
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return errorResponse(
      error instanceof Error ? error.message : "An unexpected error occurred",
      500
    );
  }
};
